import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthorizationType, CognitoUserPoolsAuthorizer, LambdaIntegration, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { DynamoStreamConstruct } from "./dynamodb-stream-construct";

export interface ConstructProps extends StackProps {
  prefixApi: string;
  restApi: LambdaRestApi;
  bucket: IBucket;
  authorizer: CognitoUserPoolsAuthorizer;
}

export class ApiPresignedFileConstruct extends Construct {

  public readonly table: dynamodb.Table;

  constructor(stack: Stack, id: string, props?: ConstructProps) {
    super(stack, id);

    const { prefixApi, restApi, bucket, authorizer } = props!;

    const tablePresigned = new DynamoStreamConstruct(stack, 'presigned-file-dynamo-construct', {
      prefix: 'presigned-file',
      partitionKey: 'user_sub',
      sortKey: 'identifier'
    });
    
    const func = new NodejsFunction(
      this,
      `ApiPresignedS3Lambda`,
      {
        functionName: `${prefixApi}-api-presigned-s3`,
        handler: "handler",
        description: 'Generate presigned url to put file',
        entry: path.join(
          __dirname,
          `/../../src/extra/api-s3-presigned/index.ts`
        ),
        runtime: lambda.Runtime.NODEJS_14_X,
        timeout: Duration.minutes(1),
        bundling: {
          externalModules: [
            'electron' 
        ]
        },
        environment: {
          BUCKET_NAME: bucket.bucketName,
          TABLE_NAME: tablePresigned.table.tableName
        }
      }
    );

    const integration = new LambdaIntegration(func);

    bucket.grantReadWrite(func);
    tablePresigned.table.grantReadWriteData(func);

    const presigned = restApi.root.addResource("presigned-file");

    const optionsCognito = {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO,
    };

    presigned.addMethod("POST", integration, optionsCognito);

    this.table = tablePresigned.table;
  }
}