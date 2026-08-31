import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import { DynamoStreamConstruct } from '../constructs/dynamodb-stream-construct' 
import { DynamoDBStreamOpenSearchConstruct } from '../constructs/dynamodb-stream-opensearch-construct' 

export interface AppStackProps extends StackProps {
  hostedZone: string;
}
export class PlatformNFTDatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: AppStackProps) {
    super(scope, id, props);

    const { hostedZone } = props!;

    const domain:opensearch.IDomain = opensearch.Domain.fromDomainEndpoint(this, 'OSDomain', `https://catalogs.${hostedZone}`);

    const apiCreds = secretsmanager.Secret.fromSecretNameV2(
      this,
      "opensearchMasterUser",
      "opensearchMasterUser"
    );

    const OSUser = apiCreds.secretValueFromJson("username").toString();
    const OSPassword = apiCreds.secretValueFromJson("password").toString();

    const tableCollectionNFT = new DynamoStreamConstruct(this, 'collection-nft-dynamo-construct', {
      prefix: 'collection-nft',
      partitionKey: 'user_sub',
      sortKey: 'identifier'
    })

    tableCollectionNFT.table.addGlobalSecondaryIndex({
      indexName: 'platformNFTDynamoDB_blockchainIndex',
      partitionKey: {name: 'blockchain', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'address', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new DynamoDBStreamOpenSearchConstruct(this, 'collection-nft-stream-opensearch-construct', {
      prefix: 'collection-nft',
      stream: tableCollectionNFT.stream,
      domain,
      index: 'platform_nft_collection_v1',
      pk: 'identifier',
      OSUser,
      OSPassword
    })

    const tableNFT = new DynamoStreamConstruct(this, 'nft-dynamo-construct', {
      prefix: 'nft',
      partitionKey: 'user_sub',
      sortKey: 'identifier'
    })

    tableNFT.table.addGlobalSecondaryIndex({
      indexName: 'platformNFTDynamoDB_blockchainIndex',
      partitionKey: {name: 'contract', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'token_id', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    tableNFT.table.addGlobalSecondaryIndex({
      indexName: 'platformNFTDynamoDB_identifierIndex',
      partitionKey: {name: 'identifier', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new DynamoDBStreamOpenSearchConstruct(this, 'nft-stream-opensearch-construct', {
      prefix: 'nft',
      stream: tableNFT.stream,
      domain,
      index: 'platform_nft_v1',
      pk: 'identifier',
      OSUser,
      OSPassword
    })

    new DynamoStreamConstruct(this, 'request-nft-dynamo-construct', {
      prefix: 'request-nft',
      partitionKey: 'token_identifier',
      sortKey: 'receiver'
    });

    const marketplaceNFT = new DynamoStreamConstruct(this, 'marketplace-nft-dynamo-construct', {
      prefix: 'marketplace-nft',
      partitionKey: 'user_sub',
      sortKey: 'identifier'
    })

    new DynamoDBStreamOpenSearchConstruct(this, 'marketplace-nft-stream-opensearch-construct', {
      prefix: 'marketplace-nft',
      stream: marketplaceNFT.stream,
      domain,
      index: 'marketplace_nft_v1',
      pk: 'identifier',
      OSUser,
      OSPassword
    })

    const whitelistRequestNFT = new DynamoStreamConstruct(this, 'wrequest-nft-dynamo-construct', {
      prefix: 'whitelist-request-nft',
      partitionKey: 'token_identifier',
      sortKey: 'identifier'
    })

    whitelistRequestNFT.table.addLocalSecondaryIndex({
      indexName: 'whitelistRequestNFT_ticketHashIndex',
      sortKey: { name: 'ticket_hash', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })
  }
}
