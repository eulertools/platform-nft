import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
export interface ConstructProps extends StackProps {
  functionName: string;
  pathLambda: string;
  description: string;
  environment: any;
  duration?: Duration;
}

export class NodeJsLambdaConstruct extends Construct {

  public readonly lambdaFunc: lambda.Function;
  public readonly integration: LambdaIntegration;

  constructor(stack: Stack, id: string, props?: ConstructProps) {
    super(stack, id);

    const { functionName, pathLambda, description, environment } = props!;

    let duration = Duration.minutes(1);

    if(props?.duration) duration = props.duration;

    const func = new NodejsFunction(
      this,
      `platform-nft-${functionName}-lambda-handler`,
      {
        functionName: `platform-nft-${functionName}-lambda-handler`,
        handler: "handler",
        description: description,
        entry: path.join(
          __dirname,
          `/../../src/platform-apis-handler/${pathLambda}/index.ts`
        ),
        runtime: lambda.Runtime.NODEJS_14_X,
        timeout: duration,
        bundling: {
          externalModules: [
            'electron' 
        ]
        },
        environment
      }
    );

    const integration = new LambdaIntegration(func);

    this.lambdaFunc = func;
    this.integration = integration;
  }
}
