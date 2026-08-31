#!/usr/bin/env node

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { NftZksnarkPipelineStack } from "../lib/stacks/zksnark-pipelines-stack";

const app = new cdk.App();

const branch = process.env.CDK_DEFAULT_ACCOUNT == process.env.CDK_DEV_ACCOUNT ? "development" : "main";

new NftZksnarkPipelineStack(
  app, "platform-api-nft-zksnark-stack",
  {
    description: "zksnark nft proccess stack",
    branch,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);

app.synth();
