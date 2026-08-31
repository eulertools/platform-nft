import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { CICDPipelineConstruct } from "../constructs/cicd-pipeline-construct";
import { PlatformApisNftDeployStage } from "../stages/platform-apis-nft-deploy-stage";

interface AppStackProps extends StackProps {
  hostedZone: string;
  branch: string;
  env: Object;
}

export class PlatformApiNftPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: AppStackProps) {
    super(scope, id, props);

    const { hostedZone, branch } = props!;

    const { cicdPipeline } = new CICDPipelineConstruct(
      this,
      "platform-api-nft",
      {
        branch,
      }
    );

    cicdPipeline.addStage(
      new PlatformApisNftDeployStage(this, "deploy", {
        hostedZone: hostedZone,
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: process.env.CDK_DEFAULT_REGION,
        },
      })
    );
  }
}
