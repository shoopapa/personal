import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as efs from "aws-cdk-lib/aws-efs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib/core";

import { env } from "../src/env";

const MINECRAFT_PORT = 25565;
const VOICE_CHAT_PORT = 24454;

export class MinecraftStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Public-only VPC — Fargate uses assignPublicIp, no NAT needed
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
      ],
    });

    // EFS — world data survives task restarts and Spot interruptions
    const worldFs = new efs.FileSystem(this, "WorldFs", {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      encrypted: true,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
      enableFargateCapacityProviders: true,
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "TaskDef", {
      cpu: 2048,
      memoryLimitMiB: 4096,
      volumes: [
        {
          name: "world",
          efsVolumeConfiguration: {
            fileSystemId: worldFs.fileSystemId,
            transitEncryption: "ENABLED",
          },
        },
      ],
    });

    worldFs.grantReadWrite(taskDef.taskRole);

    const logGroup = new logs.LogGroup(this, "Logs", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const container = taskDef.addContainer("minecraft", {
      image: ecs.ContainerImage.fromRegistry("itzg/minecraft-server"),
      essential: true,
      environment: {
        EULA: env.MINECRAFT_EULA,
        TYPE: "FABRIC",
        VERSION: "1.21.4",
        MEMORY: "3G",
        MODRINTH_PROJECTS: "fabric-api,simple-voice-chat",
      },
      portMappings: [
        { containerPort: MINECRAFT_PORT, protocol: ecs.Protocol.TCP },
        { containerPort: VOICE_CHAT_PORT, protocol: ecs.Protocol.UDP },
      ],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "minecraft", logGroup }),
      // Gives the JVM time to flush the world to EFS on shutdown
      stopTimeout: cdk.Duration.seconds(60),
    });

    container.addMountPoints({
      containerPath: "/data",
      sourceVolume: "world",
      readOnly: false,
    });

    const taskSg = new ec2.SecurityGroup(this, "TaskSg", {
      vpc,
      allowAllOutbound: true,
    });
    taskSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(MINECRAFT_PORT));
    taskSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(VOICE_CHAT_PORT));

    worldFs.connections.allowDefaultPortFrom(taskSg);

    new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [taskSg],
      capacityProviderStrategies: [
        { capacityProvider: "FARGATE_SPOT", weight: 1 },
        { capacityProvider: "FARGATE", base: 1, weight: 0 },
      ],
      // minHealthyPercent: 0 is required with desiredCount: 1 for rolling updates
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      // VERSION1_4 is required for EFS mounts
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
    });

    new cdk.CfnOutput(this, "EfsId", {
      value: worldFs.fileSystemId,
      description: "EFS filesystem ID for world data",
    });
  }
}
