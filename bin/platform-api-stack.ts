#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { CdnStack } from "../lib/stacks/cdn-stack";
import { PlatformApiNftPipelineStack } from "../lib/pipelines/platform-api-nft-pipeline-stack";
import { PlatformNFTDatabaseStack } from "../lib/stacks/storage-stack";
import { ValidationNFTStack } from "../lib/stacks/validation-nft-stack";

const app = new cdk.App();

const hostedZone =
  process.env.CDK_DEFAULT_ACCOUNT == process.env.CDK_DEV_ACCOUNT
    ? "dev.euler.tools"
    : "prod.euler.tools";

const branch = process.env.CDK_DEFAULT_ACCOUNT == process.env.CDK_DEV_ACCOUNT ? "development" : "main";

new PlatformNFTDatabaseStack(app, 'PlatformNFTDatabaseStack', {
  description: 'App stack for platform of nft',
  hostedZone,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new CdnStack(
  app, "platform-api-nft-cdn-stack",
  {
    hostedZone,
    description: "Cdn nft assets stack",
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);

new PlatformApiNftPipelineStack(
  app,
  "platform-api-nft-pipeline-stack",
  {
    hostedZone,
    branch,
    description: "Platform Api Pipeline stack with platform api gateway",
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);

app.synth();
