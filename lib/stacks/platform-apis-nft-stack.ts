import { CfnOutput, Duration, Fn, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthorizationType, CognitoUserPoolsAuthorizer, LambdaIntegration, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { NodeJsLambdaConstruct } from "../constructs/node-js-lambda-construct";
import { Effect, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53targets from "aws-cdk-lib/aws-route53-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Code } from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { LayerConstruct } from "../constructs/layer-constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ApiPresignedFileConstruct } from "../../lib/constructs/api-presigned-file-construct";

require('dotenv').config();

interface AppStackProps extends StackProps {
  hostedZone: string;
}

export class PlatformApiNftStack extends Stack {
  public readonly apiEndpoint: CfnOutput;
  constructor(scope: Construct, id: string, props?: AppStackProps) {
    super(scope, id, props);

    const { hostedZone } = props!;

    const certificateArn = ssm.StringParameter.fromStringParameterName(
      this,
      "ssm-certificate-public-api",
      "/devops-infra/certificate-public-api"
    ).stringValue;

    const certificate = Certificate.fromCertificateArn(
      this,
      "Certificate",
      certificateArn
    );

    const publicZone = route53.HostedZone.fromLookup(this, "public-zone", {
      domainName: hostedZone,
      privateZone: false,
    });

    const apiResourcePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["execute-api:Invoke"],
          principals: [new iam.AnyPrincipal()],
          resources: ["execute-api:/*"],
        }),
      ],
    });

    const dynamodbLayer = new LayerConstruct(this, 'platform-nft-dynamodb-layer-construct', {
      layerName: 'dynamodb',
      description: 'Layer utility for dynamodb'
    });

    const web3Layer = new LayerConstruct(this, 'platform-nft-web3-layer-construct', {
      layerName: 'web3',
      description: 'Layer utility for web3'
    });

    const elasticLayer = new LayerConstruct(this, 'platform-nft-elasticsearch-layer-construct', {
      layerName: 'elasticsearch',
      description: 'Layer utility for web3'
    });

    const handler = new lambda.Function(this, `${id}-handler`, {
      functionName: `${id}-handler`,
      handler: "handler",
      description: "Create lambda that logs events",
      code: Code.fromInline(`
        exports.handler = async (event) => {
          console.log('event: ', event)
        };
      `),
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.minutes(1),
    });

    handler.addLayers(dynamodbLayer.layer);
    handler.addLayers(web3Layer.layer);
    handler.addLayers(elasticLayer.layer);

    const restApi = new LambdaRestApi(this, `platform-apis-nft`, {
      handler: handler,
      description: "Platform API NFT",
      deployOptions: {
        stageName: process.env.ENV,
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"]
      },
      restApiName: "platform-apis-nft",
      proxy: false,
      policy: apiResourcePolicy,
    });

    const domain = `nft.api.${hostedZone}`

    restApi.addDomainName("platform-api", {
      domainName: domain,
      certificate: certificate,
    });

    new route53.ARecord(this, "custom-domain-alias-record-subscriptions", {
      recordName: "nft.api",
      zone: publicZone,
      target: route53.RecordTarget.fromAlias(
        new route53targets.ApiGateway(restApi)
      ),
    });

    const bucketName = ssm.StringParameter.fromStringParameterName(
      this,
      "ssm-bucket-nft-assets",
      "/platform-nft/bucket-nft-assets"
    ).stringValue;

    const NftTableArn = ssm.StringParameter.fromStringParameterName(
      this,
      "ssm-nft-table-output",
      "/directory/table/nft-table-arn"
    );

    const nftCollectionTableArn = ssm.StringParameter.fromStringParameterName(
      this,
      "ssm-collection-nft-table-output",
      "/directory/table/collection-nft-table-arn"
    );

    const requestNftTableArn = ssm.StringParameter.fromStringParameterName(
      this,
      "ssm-request-nft-table-output",
      "/directory/table/request-nft-table-arn"
    );

    const wrequestNftTableArn = ssm.StringParameter.fromStringParameterName(
      this,
      "ssm-whitelist-request-nft-table-output",
      "/directory/table/whitelist-request-nft-table-arn"
    );

    const marketplaceTableArn = ssm.StringParameter.fromStringParameterName(
      this,
      "ssm-marketplace-nft-table-output",
      "/directory/table/marketplace-nft-table-arn"
    );

    const nftTable = dynamodb.Table.fromTableArn(this,
      'nft-table', NftTableArn.stringValue);

    const collectionNftTable = dynamodb.Table.fromTableArn(this,
      'collection-nft-table', nftCollectionTableArn.stringValue);

    const requestNftTable = dynamodb.Table.fromTableArn(this,
      'request-nft-table', requestNftTableArn.stringValue);

    const marketplaceTable = dynamodb.Table.fromTableArn(this,
      'marketplace-nft-table', marketplaceTableArn.stringValue);

    const wRequestNftTable = dynamodb.Table.fromTableArn(this,
        'whitelist-request-nft-table', wrequestNftTableArn.stringValue);

    const assetsBucket = s3.Bucket.fromBucketName(
      this, 'nft-assets-bucket-output', bucketName
    );

    const zksnarkService = new apprunner.Service(this, 'NftZksnarkService', {
      source: apprunner.Source.fromEcr({
        imageConfiguration: { port: 9000 },
        repository: ecr.Repository.fromRepositoryName(this, 'platformNftRespository', 'platform-nft-zksnark'),
        tagOrDigest: 'latest',
      }),
    });

    const mrCreds = secretsmanager.Secret.fromSecretNameV2(
      this,
      "apis/moralis",
      "apis/moralis"
    );

    const opensearcCreds = secretsmanager.Secret.fromSecretNameV2(
      this,
      "opensearchMasterUser",
      "opensearchMasterUser"
    );

    const OSUser = opensearcCreds.secretValueFromJson("username").toString();
    const OSPassword = opensearcCreds.secretValueFromJson("password").toString();
    const MRApiKey = mrCreds.secretValueFromJson("api-key").toString();

    const userPoolId = ssm.StringParameter.fromStringParameterName(
      this,
      "user-pool-id",
      "/directory/cognito/user-pool"
    );

    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      "platform-directory-user-pool-id",
      userPoolId.stringValue
    );

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      "api-gateway-cognito-authorizer",
      {
        cognitoUserPools: [userPool],
        authorizerName: "cognito-authorizer",
        identitySource: "method.request.header.Authorization",
      }
    );

    const apiPresigned = new ApiPresignedFileConstruct(this, "api-presigned-file-construct", {
      prefixApi: 'platform-nft',
      restApi,
      bucket: assetsBucket,
      authorizer
    })

    const optionsCognito = {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO,
    };

    const environment = {
      DOMAIN: domain,
      ASSETS_DOMAIN: `nft.assets.${hostedZone}`,
      BLOCKCHAIN_RPCS: JSON.stringify({
        'bsc': 'https://bsc-dataseed.binance.org/',
        'polygon': 'https://polygon-rpc.com',
        'eth': 'https://eth.nodes.prod.euler.tools/rpc',
        'bsctest': 'https://bsc-testnet-rpc.publicnode.com',
        'polygontest': 'https://rpc-amoy.polygon.technology'
      }),
      OS_DOMAIN: `catalogs.${hostedZone}`,
      OS_USER: OSUser,
      OS_PASSWORD: OSPassword,
      URL_APP_RUNNER_ZKSNARK: `https://${zksnarkService.serviceUrl}`,
      ASSETS_BUCKET_NAME: bucketName,
      TABLE_PLATFORM_NFT_COLLECTION: collectionNftTable.tableName,
      TABLE_PLATFORM_NFT: nftTable.tableName,
      TABLE_REQUEST_NFT: requestNftTable.tableName,
      MORALIS_API_KEY: MRApiKey,
      TABLE_PLATFORM_NFT_MARKETPLACE: marketplaceTable.tableName,
      TABLE_WHITELIST_REQUEST_NFT: wRequestNftTable.tableName,
      TABLE_PRESIGNED_FILE: apiPresigned.table.tableName,
      THRESHOLD_MODERATION: '90',
      REDIS_ENDPOINT: `platform.cache.${hostedZone}`,
      REDIS_PORT: '6379',
    };

    const deleteNftLambda = new NodeJsLambdaConstruct(
      this,
      "delete-nft-lambda-construct",
      {
        functionName: "delete-nft",
        pathLambda: "nft/delete",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    nftTable.grantReadWriteData(deleteNftLambda.lambdaFunc);

    const getNftLambda = new NodeJsLambdaConstruct(
      this,
      "get-nft-lambda-construct",
      {
        functionName: "get-nft",
        pathLambda: "nft/get",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    nftTable.grantReadWriteData(getNftLambda.lambdaFunc);

    getNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    const getInfoNftLambda = new NodeJsLambdaConstruct(
      this,
      "get-info-nft-lambda-construct",
      {
        functionName: "get-info-nft",
        pathLambda: "nft/get-info",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    nftTable.grantReadWriteData(getInfoNftLambda.lambdaFunc);

    getInfoNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    const getInfoAddressNftLambda = new NodeJsLambdaConstruct(
      this,
      "get-by-address-nft-lambda-construct",
      {
        functionName: "get-by-address-nft",
        pathLambda: "nft/get-by-address",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    nftTable.grantReadWriteData(getInfoAddressNftLambda.lambdaFunc);

    getInfoAddressNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    const getMeNftLambda = new NodeJsLambdaConstruct(
      this,
      "get-me-nft-lambda-construct",
      {
        functionName: "get-me-nft",
        pathLambda: "nft/get-me",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    const getCollectionNftsMeNftLambda = new NodeJsLambdaConstruct(
      this,
      "get-collection-nfts-me-nft-lambda-construct",
      {
        functionName: "get-collection-nfts-me-nft",
        pathLambda: "nft/get-me",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    const postSearchNftLambda = new NodeJsLambdaConstruct(
      this,
      "post-search-nft-lambda-construct",
      {
        functionName: "post-search-nft",
        pathLambda: "nft/post-search",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    const postNftLambda = new NodeJsLambdaConstruct(
      this,
      "post-nft-lambda-construct",
      {
        functionName: "post-nft",
        pathLambda: "nft/post",
        description: `Create Platform Api nft lambda handler`,
        environment,
        duration: Duration.minutes(5)
      },
    );

    nftTable.grantReadWriteData(postNftLambda.lambdaFunc);
    apiPresigned.table.grantReadWriteData(postNftLambda.lambdaFunc);

    postNftLambda.lambdaFunc.addToRolePolicy(new iam.PolicyStatement({
      actions: [ 'rekognition:DetectModerationLabels', 'rekognition:GetContentModeration'],
      effect: iam.Effect.ALLOW,
      resources: [ '*' ]
    }));

    postNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    assetsBucket.grantReadWrite(postNftLambda.lambdaFunc);

    const putNftLambda = new NodeJsLambdaConstruct(
      this,
      "put-nft-lambda-construct",
      {
        functionName: "put-nft",
        pathLambda: "nft/put",
        description: `Create Platform Api nft lambda handler`,
        environment,
        duration: Duration.minutes(5)
      },
    );

    nftTable.grantReadWriteData(putNftLambda.lambdaFunc);

    putNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    assetsBucket.grantReadWrite(putNftLambda.lambdaFunc);

    putNftLambda.lambdaFunc.addToRolePolicy(new iam.PolicyStatement({
      actions: [ 'rekognition:DetectModerationLabels', 'rekognition:GetContentModeration'],
      effect: iam.Effect.ALLOW,
      resources: [ '*' ]
    }));

    const getCollectionMeLambda = new NodeJsLambdaConstruct(
      this,
      "get-collection-me-lambda-construct",
      {
        functionName: "get-collection-me",
        pathLambda: "collection/get-me",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    collectionNftTable.grantReadWriteData(getCollectionMeLambda.lambdaFunc);

    const postSearchCollectionLambda = new NodeJsLambdaConstruct(
      this,
      "post-search-collection-lambda-construct",
      {
        functionName: "post-search-collection",
        pathLambda: "collection/post-search",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    const deleteCollectionLambda = new NodeJsLambdaConstruct(
      this,
      "delete-collection-lambda-construct",
      {
        functionName: "delete-collection",
        pathLambda: "collection/delete",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    collectionNftTable.grantReadWriteData(deleteCollectionLambda.lambdaFunc);

    const getCollectionLambda = new NodeJsLambdaConstruct(
      this,
      "get-collection-lambda-construct",
      {
        functionName: "get-collection",
        pathLambda: "collection/get",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    collectionNftTable.grantReadWriteData(getCollectionLambda.lambdaFunc);

    const postCollectionLambda = new NodeJsLambdaConstruct(
      this,
      "post-collection-lambda-construct",
      {
        functionName: "post-collection",
        pathLambda: "collection/post",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    collectionNftTable.grantReadWriteData(postCollectionLambda.lambdaFunc);
    assetsBucket.grantReadWrite(postCollectionLambda.lambdaFunc);

    const putCollectionLambda = new NodeJsLambdaConstruct(
      this,
      "put-collection-lambda-construct",
      {
        functionName: "put-collection",
        pathLambda: "collection/put",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    collectionNftTable.grantReadWriteData(putCollectionLambda.lambdaFunc);
    assetsBucket.grantReadWrite(putCollectionLambda.lambdaFunc);

    const walletSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "evm-wallet-minter-credentials",
      `evmMinterNft`
    );

    const getCollectionByAddressLambda = new NodeJsLambdaConstruct(
      this,
      "get-by-address-collection-lambda-construct",
      {
        functionName: "get-by-address-collection",
        pathLambda: "collection/get-by-address",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    collectionNftTable.grantReadWriteData(getCollectionByAddressLambda.lambdaFunc);

    getCollectionByAddressLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [collectionNftTable.tableArn + '/index/*'],
      })
    );

    const postAdMarketplaceNftLambda = new NodeJsLambdaConstruct(
      this,
      "post-marketplace-nft-lambda-construct",
      {
        functionName: "post-ad-marketplace-nft",
        pathLambda: "marketplace/post-ad",
        description: `Post nft marketplace`,
        environment
      },
    );

    marketplaceTable.grantReadWriteData(postAdMarketplaceNftLambda.lambdaFunc);
    nftTable.grantReadWriteData(postAdMarketplaceNftLambda.lambdaFunc);

    postAdMarketplaceNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    const getAdMarketplaceLambda = new NodeJsLambdaConstruct(
      this,
      "get-ad-marketplace-nft-lambda-construct",
      {
        functionName: "get-ad-marketplace-nft",
        pathLambda: "marketplace/get-ad",
        description: `Get ad from marketplace by id`,
        environment
      },
    );
    
    const getAdBuyMarketplaceLambda = new NodeJsLambdaConstruct(
      this,
      "get-ad-buy-marketplace-nft-lambda-construct",
      {
        functionName: "get-ad-buy-marketplace-nft",
        pathLambda: "marketplace/get-ad-buy",
        description: `Get request to buy from ad id`,
        environment: {
          ...environment,
          MINTER: walletSecret.secretValue.toString(),
        }
      },
    );

    nftTable.grantReadData(getAdBuyMarketplaceLambda.lambdaFunc);

    getAdBuyMarketplaceLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    const postSearchMarketplaceLambda = new NodeJsLambdaConstruct(
      this,
      "post-search-marketplace-lambda-construct",
      {
        functionName: "post-search-ad-marketplace",
        pathLambda: "marketplace/post-search-ad",
        description: `Search ads`,
        environment
      },
    );

    const postRequestNftLambda = new NodeJsLambdaConstruct(
      this,
      "post-request-nft-lambda-construct",
      {
        functionName: "post-request-nft",
        pathLambda: "request-nft/post",
        description: `Create Platform Api nft lambda handler`,
        environment: {
          ...environment,
          MINTER: walletSecret.secretValue.toString(),
        },
        duration: Duration.minutes(5)
      },
    );

    requestNftTable.grantReadWriteData(postRequestNftLambda.lambdaFunc);

    postRequestNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    nftTable.grantReadWriteData(postRequestNftLambda.lambdaFunc);
    wRequestNftTable.grantReadWriteData(postRequestNftLambda.lambdaFunc);

    postRequestNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    postRequestNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [wRequestNftTable.tableArn + '/index/*'],
      })
    );
    
    const getRequestNftLambda = new NodeJsLambdaConstruct(
      this,
      "get-request-nft-lambda-construct",
      {
        functionName: "get-request-nft",
        pathLambda: "request-nft/get",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    requestNftTable.grantReadWriteData(getRequestNftLambda.lambdaFunc);

    getRequestNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [requestNftTable.tableArn + '/index/*'],
      })
    );

    const postTicketClaimLambda = new NodeJsLambdaConstruct(
      this,
      "post-ticket-claim-lambda-construct",
      {
        functionName: "post-ticket-claim-nft",
        pathLambda: "whitelist-request-nft/post-ticket-claim",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    wRequestNftTable.grantReadWriteData(postTicketClaimLambda.lambdaFunc);

    const postWRequestNftLambda = new NodeJsLambdaConstruct(
      this,
      "post-whitelist-request-nft-lambda-construct",
      {
        functionName: "post-whitelist-request-nft",
        pathLambda: "whitelist-request-nft/post",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    wRequestNftTable.grantReadWriteData(postWRequestNftLambda.lambdaFunc);

    postWRequestNftLambda.lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:Scan'],
        resources: [nftTable.tableArn + '/index/*'],
      })
    );

    const getAddressNftLambda = new NodeJsLambdaConstruct(
      this,
      "get-address-nft-lambda-construct",
      {
        functionName: "get-address-nft",
        pathLambda: "address/get",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    const getAddressNftLambdav2 = new NodeJsLambdaConstruct(
      this,
      "get-address-nft-v2-lambda-construct",
      {
        functionName: "get-address-nft-v2",
        pathLambda: "address/get-v2",
        description: `Create Platform Api nft lambda handler`,
        environment
      },
    );

    const nft = restApi.root.addResource("nft");

    nft.addMethod("POST", postNftLambda.integration, optionsCognito)

    nft.addResource("me").addMethod("GET", getMeNftLambda.integration, optionsCognito);
    nft.addResource("search").addMethod("POST", postSearchNftLambda.integration);

    const nftUuid = nft.addResource("{identifier}");

    nftUuid.addMethod("GET", getNftLambda.integration, optionsCognito)
    nftUuid.addMethod("PUT", putNftLambda.integration, optionsCognito)
    nftUuid.addMethod("DELETE", deleteNftLambda.integration, optionsCognito)

    nftUuid.addResource("info.json").addMethod("GET", getInfoNftLambda.integration);

    const V2 = restApi.root.addResource("v2")

    V2
    .addResource("{blockchain}")
    .addResource("address")
    .addResource("{address}")
    .addMethod("GET", getAddressNftLambdav2.integration);

    const marketplace = restApi.root.addResource("marketplace");

    const ad = marketplace.addResource("ad");

    ad.addMethod("POST", postAdMarketplaceNftLambda.integration, optionsCognito);

    const adIdentifier = ad.addResource("{identifier}");
    const postSearchMarketplace = ad.addResource("search");
  
    adIdentifier.addMethod("GET", getAdMarketplaceLambda.integration);
    postSearchMarketplace.addMethod("POST", postSearchMarketplaceLambda.integration);

    adIdentifier.addResource("buy").addMethod("GET", getAdBuyMarketplaceLambda.integration);
    
    const blockchain = restApi.root.addResource("{blockchain}");

    blockchain
      .addResource("nft")
      .addResource("{address}")
      .addResource("{token_id}")
      .addMethod("GET", getInfoAddressNftLambda.integration);

    blockchain
      .addResource("collection")
      .addResource("{address}")
      .addMethod("GET", getCollectionByAddressLambda.integration);

    blockchain
      .addResource("address")
      .addResource("{address}")
      .addMethod("GET", getAddressNftLambda.integration);

    const collection = restApi.root.addResource("collection");

    const collectionIdentifier = collection.addResource("{identifier}");

    collectionIdentifier.addResource("nfts")
      .addResource("me")
      .addMethod("GET", getCollectionNftsMeNftLambda.integration, optionsCognito);

    collection.addResource("me").addMethod("GET", getCollectionMeLambda.integration, optionsCognito);
    collection.addResource("search").addMethod("POST", postSearchCollectionLambda.integration);

    collection.addMethod("POST", postCollectionLambda.integration, optionsCognito);

    collectionIdentifier.addMethod("GET", getCollectionLambda.integration, optionsCognito);
    collectionIdentifier.addMethod("PUT", putCollectionLambda.integration, optionsCognito);
    collectionIdentifier.addMethod("DELETE", deleteCollectionLambda.integration, optionsCognito);

    const request_nft = blockchain.addResource("request-nft");

    const tokenRequestNFT = request_nft
      .addResource("{address}")
      .addResource("{token_id}")

    tokenRequestNFT
      .addResource("receiver")
      .addResource("{receiver}")
      .addMethod("GET", getRequestNftLambda.integration);

    tokenRequestNFT.addResource("{kind_claim}").addMethod("POST", postRequestNftLambda.integration);

    const ticket_claim = blockchain.addResource("ticket-claim");

    const ticketRequestNFT = ticket_claim
      .addResource("{address}")
      .addResource("{token_id}")

    ticketRequestNFT.addMethod("POST", postTicketClaimLambda.integration);

    const whitelist_request = blockchain.addResource("whitelist-request");

    const whitelistRequestNFT = whitelist_request
      .addResource("{address}")
      .addResource("{token_id}")

    whitelistRequestNFT.addMethod("POST", postWRequestNftLambda.integration, optionsCognito);

    this.apiEndpoint = new CfnOutput(this, "Url", {
      value: restApi.url,
    });
  }
}
