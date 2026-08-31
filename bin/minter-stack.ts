#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { MinterStack } from "../lib/stacks/minter-stack";

const app = new cdk.App();

new MinterStack(
  app, "platform-api-nft-minter-stack",
  {
    description: "Minter nft stack",
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);

app.synth();
