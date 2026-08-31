import * as DynamoDB from "/opt/nodejs/dynamodb";
import { Web3 } from "/opt/nodejs/web3";
import { getHeaders } from "../../utils/getHeaders";
import { detectModerationLabels } from "src/platform-apis-handler/utils/detectModerationLabels";

const AWS = require('aws-sdk');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const s3 = new AWS.S3();

require('dotenv').config();

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body:any;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const parseBody = JSON.parse(event.body);

    const identifier = AWS.util.uuid.v4();

    const { blockchain, kind, metadata, collection } = parseBody;

    const address = parseBody.address.toLowerCase();
  
    const nft:any = {
      identifier,
      user_sub: event.requestContext.authorizer.claims.sub,
      token_uri: `https://${process.env.DOMAIN}/nft/${identifier}/info.json`,
      blockchain,
      address,
      collection,
      contract: `${blockchain}~${address}`,
      kind,
      metadata,
      create_date: new Date().toISOString(),
      update_date: new Date().toISOString(),
    };

    let created = false;

    if(nft.kind === 'generic-managed') {
      nft.token_id = Web3.utils.toBN(Web3.utils.sha3(nft.identifier)).toString();
    } else if(parseBody.token_id) {
      nft.token_id = parseBody.token_id;

      const searchDuplicated = await DynamoDB.getItem({
        TableName: process.env.TABLE_PLATFORM_NFT,
        IndexName : 'platformNFTDynamoDB_blockchainIndex',
        KeyConditionExpression: '#contract = :contract AND #token_id = :token_id',
        ExpressionAttributeNames:{
            '#contract': 'contract',
            '#token_id': 'token_id'
        },
        ExpressionAttributeValues: {
          ':contract': { S: `${blockchain}~${address}` },
          ':token_id': { S: nft.token_id } 
        },
        ProjectionExpression: '#contract, #token_id'
      });

      if(searchDuplicated) created = true;
    }

    if(!created) {

      if(nft.metadata?.image) {

        if(!uuidRegex.test(nft.metadata?.image)) throw new Error('NOT_FORMAT_PRESIGNED_IMAGE');

        console.log('Image identifier', nft.metadata?.image);

        const image = await DynamoDB.getItem({
          TableName: process.env.TABLE_PRESIGNED_FILE,
          KeyConditionExpression: "#user_sub = :user_sub AND #identifier = :identifier",
          ExpressionAttributeNames:{
            "#identifier": "identifier",
            "#user_sub": "user_sub"
          },
          ExpressionAttributeValues: {
              ":user_sub": { S: nft.user_sub },
              ":identifier": { S: nft.metadata?.image }
          }
        });

        if(!image) throw new Error('NOT_FIND_PRESIGNED_IMAGE');

        const bucket = {
          bucket: process.env.ASSETS_BUCKET_NAME,
          path: `nft/${identifier}/image.${image.extension}`
        }

        console.log('Bucket', image.bucket);

        const result = await detectModerationLabels(image.bucket, 
          Number.parseInt(process.env.THRESHOLD_MODERATION as string));
  
        if((result.length > 0)) throw new Error('BAD_IMAGE_CONTENT');
  
        const copyParams = { 
          CopySource: `${image.bucket.name}/${image.bucket.path}`,
          Bucket: bucket.bucket,
          Key: bucket.path
        };
  
        await s3.copyObject(copyParams).promise();

        nft.metadata.image = `https://${process.env.ASSETS_DOMAIN}/nft/${identifier}/image.${image.extension}`;
      }

      if(parseBody.signature) nft.signature = parseBody.signature;
    
      await DynamoDB.updateItem(process.env.TABLE_PLATFORM_NFT, { 
        user_sub: nft.user_sub, identifier: nft.identifier  
      }, nft );
  
      body = {
        status: statusCode,
        description: "Successful request",
        payload: {
          identifier: nft.identifier,
          token_uri: nft.token_uri,
          address: nft.address
        }
      };

      if(nft.token_id) body.payload.token_id = nft.token_id;
      
    } else {
      statusCode = 400;
      body = {
        status: statusCode,
        description: 'Token already created',
      };
    }
    
    
  } catch (err) {
    if(err.message.includes('BAD_IMAGE_CONTENT')){
      statusCode = 400;
      body = {
        status: statusCode,
        description: 'Bad image content',
      };
    }else if(err.message.includes('NOT_FORMAT_PRESIGNED_IMAGE') || 
      err.message.includes('NOT_FIND_PRESIGNED_IMAGE')){

      console.log('ERROR', err.message);

      statusCode = 400;
      body = {
        status: statusCode,
        description: 'Not correct presigned image',
      };
    } else {
      console.log(err);
      statusCode = 500;
      body = {
        status: statusCode,
        description: 'Internal server error',
      };
    }
  } finally {
    console.log({ data: body });
    body = JSON.stringify(body);
  }
  
  return {
    statusCode,
    body,
    headers
  };
}