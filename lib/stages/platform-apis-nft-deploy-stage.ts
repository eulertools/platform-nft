import { CfnOutput, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PlatformApiNftStack } from "../stacks/platform-apis-nft-stack";

interface AppStackProps extends StageProps {
  hostedZone: string;
}

export class PlatformApisNftDeployStage extends Stage {
  public readonly apiEndpoint: CfnOutput;
  constructor(scope: Construct, id: string, props?: AppStackProps) {
    super(scope, id, props);

    const { hostedZone } = props!;

    const service = new PlatformApiNftStack(
      this,
      "platform-api-nft-stack",
      {
        hostedZone: hostedZone,
      }
    );

    this.apiEndpoint = service.apiEndpoint;
  }
}
