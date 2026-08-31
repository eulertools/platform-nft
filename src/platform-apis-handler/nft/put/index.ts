import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";
import { detectModerationLabels } from "../../utils/detectModerationLabels";

const AWS = require('aws-sdk');

const s3 = new AWS.S3();

require('dotenv').config();

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const parseBody = JSON.parse(event.body);
  
    const identifier = event.pathParameters.identifier;
    const user_sub = event.requestContext.authorizer.claims.sub;
  
    const nft:any = {
      identifier,
      user_sub,
      update_date: new Date().toISOString()
    };

    const result = await DynamoDB.getItem({
      TableName: process.env.TABLE_PLATFORM_NFT,
      KeyConditionExpression: "#user_sub = :user_sub AND #identifier = :identifier",
      ExpressionAttributeNames:{
        "#identifier": "identifier",
        "#user_sub": "user_sub",
        "#blockchain": "blockchain",
        "#address": "address",
        "#token_id": "token_id",
        "#metadata": "metadata",
      },
      ExpressionAttributeValues: {
          ":user_sub": { S: user_sub },
          ":identifier": { S: identifier }
      },
      ProjectionExpression: '#identifier, #user_sub, #blockchain, #address, #token_id, #metadata'
    });
  
    if(result) {

      let created = false;

      if(!result.token_id && parseBody.token_id)  {

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
            ':contract': { S: `${result.blockchain}~${result.address}` },
            ':token_id': { S: nft.token_id } 
          },
          ProjectionExpression: '#contract, #token_id'
        });

        if(searchDuplicated) created = true;
      }

      if(!created) {
        
        if(parseBody.metadata)  {

          const metadata = parseBody.metadata;

          metadata.image = result.metadata.image;

          nft.metadata = metadata;
        }

        if(parseBody.signature) nft.signature = parseBody.signature;

        await DynamoDB.updateItem(process.env.TABLE_PLATFORM_NFT, { user_sub, identifier }, nft );

        body = {
          status: statusCode,
          description: "Successful request",
        };
      } else {
        statusCode = 400;
        body = {
          status: statusCode,
          description: 'Token already created',
        };
      }

    } else {
      statusCode = 404;
      body = {
        status: statusCode,
        description: 'Not found',
      };
    }
  } catch (err) {
    if(err.message.includes('ExpressionAttributeNames must not be empty')) {
      body = {
        status: statusCode,
        description: "Successful request",
      };
    }else {
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