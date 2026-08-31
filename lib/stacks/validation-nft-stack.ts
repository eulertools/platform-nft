import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class ValidationNFTStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    
    super(scope, id, props);

    const NftTableArn = ssm.StringParameter.fromStringParameterName(
      this,
      "ssm-nft-table-output",
      "/directory/table/nft-table-arn"
    );

    const nftTable = dynamodb.Table.fromTableArn(this, 
      'nft-table', NftTableArn.stringValue);

    const queue = new sqs.Queue(this, `ValidationNFTQueue`, {
        visibilityTimeout: Duration.seconds(300),
    });

    const eventSource = new lambdaEventSources.SqsEventSource(
        queue,
        {
          batchSize: 1,
          enabled: true,
        }
      );

    const handler = new NodejsFunction(this, 'ValidationNFTHandler', {
        description: 'Retrieves the nft data from SQS and validate the image',
        memorySize: 1024,
        timeout: Duration.seconds(10),
        handler: 'handler',
        functionName: `validation-nft`,
        runtime: lambda.Runtime.NODEJS_14_X,
        entry: path.join(__dirname, `/../src/validation-nft/index.ts`),
        environment: {
          TABLE_PLATFORM_NFT: nftTable.tableName,
          THRESHOLD_MODERATION: '90'
        },
        bundling: {
            minify: true,
            externalModules: ['electron','aws-sdk'],
        },
        reservedConcurrentExecutions: 1
    });
  
    handler.addEventSource(eventSource);
    queue.grantConsumeMessages(handler);
  }
}