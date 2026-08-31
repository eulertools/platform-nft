import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";

const AWS = require('aws-sdk');

const s3 = new AWS.S3();

require('dotenv').config();

const importS3 = async (identifier:string, kind:string, image:string, collection:any) => {

  const split = image.split(',');

  const extension = split[0].split('\/')[1].split(';')[0];

  const uploadParams = { 
    Bucket: process.env.ASSETS_BUCKET_NAME, 
    Key: `collection/${identifier}/${kind}.${extension}`, 
    Body: Buffer.from(split[1],'base64')
  };

  const data = await s3.upload(uploadParams).promise();
  
  console.log("Upload Success", data);

  collection[kind] = `https://${process.env.ASSETS_DOMAIN}/collection/${identifier}/${kind}.${extension}`;
}

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const parseBody = JSON.parse(event.body);
  
    const identifier = event.pathParameters.identifier;
    const user_sub = event.requestContext.authorizer.claims.sub;
  
    let collection:any = {
      identifier,
      user_sub,
      update_date: new Date().toISOString()
    };

    if(parseBody.name) collection.name = parseBody.name;
    if(parseBody.description) collection.description = parseBody.description;
    if(parseBody.image) await importS3(identifier, 'image', parseBody.image, collection);
    if(parseBody.banner) await importS3(identifier, 'banner', parseBody.banner, collection);

    const result = await DynamoDB.getItem({
      TableName: process.env.TABLE_PLATFORM_NFT_COLLECTION,
      KeyConditionExpression: "#user_sub = :user_sub AND #identifier = :identifier",
      ExpressionAttributeNames:{
        "#identifier": "identifier",
        "#user_sub": "user_sub"
      },
      ExpressionAttributeValues: {
          ":user_sub": { S: user_sub },
          ":identifier": { S: identifier }
      },
      ProjectionExpression: 'identifier, user_sub'
    });

    if(result) {

      await DynamoDB.updateItem(process.env.TABLE_PLATFORM_NFT_COLLECTION, { user_sub, identifier }, collection );

      body = {
        status: statusCode,
        description: "Successful request",
      };
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