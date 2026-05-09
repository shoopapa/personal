import {
  CfnOIDCProvider,
  PolicyDocument,
  PolicyStatement,
  Role,
  WebIdentityPrincipal,
} from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib/core";

import {
  GITHUB_ORG,
  GITHUB_REPO,
  GitHubOidcAwsRoleName,
} from "../src/infra-conts";

export class OidcStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const githubOidcProvider = new CfnOIDCProvider(
      this,
      "GitHubOidcProvider",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIdList: ["sts.amazonaws.com"],
        thumbprintList: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
      },
    );

    const githubRole = new Role(this, "GitHubOidcAwsRole", {
      assumedBy: new WebIdentityPrincipal(githubOidcProvider.attrArn, {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": `repo:${GITHUB_ORG}/${GITHUB_REPO}:*`,
          },
        },
      ),
      inlinePolicies: {
        GitHubOidcAwsPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ["*"],
              resources: ["*"],
            }),
          ],
        }),
      },
      roleName: GitHubOidcAwsRoleName,
      description: "Role assumed by GitHub Actions via OIDC",
    });

    new cdk.CfnOutput(this, "GitHubOidcAwsRoleArn", {
      value: githubRole.roleArn,
      description: "Set as AWS_ROLE_ARN secret in GitHub repo settings",
    });
  }
}
