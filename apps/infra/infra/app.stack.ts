import * as cdk from "aws-cdk-lib/core";

import { env } from "../src/env";
import { MinecraftStack } from "./minecraft.stack";

const awsEnv = {
  account: env.AWS_ACCOUNT_ID,
  region: env.AWS_REGION,
};

const app = new cdk.App();
new MinecraftStack(app, "Minecraft", { env: awsEnv });
