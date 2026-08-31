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

    const { address, blockchain, name, description, kind } = parseBody;

    const user_sub = event.requestContext.authorizer.claims.sub;
    const identifier = AWS.util.uuid.v4();

    const collection:any = {
      identifier,
      user_sub,
      blockchain,
      address,
      name,
      description,
      kind,
      create_date: new Date().toISOString(),
      update_date: new Date().toISOString()
    }

    if(parseBody.image) await importS3(`${identifier}`, 'image', parseBody.image, collection);
  
    if(parseBody.banner) await importS3(`${identifier}`, 'banner', parseBody.image, collection)

    if(parseBody.owner) collection.owner = parseBody.owner;

    await DynamoDB.updateItem(process.env.TABLE_PLATFORM_NFT_COLLECTION, { identifier, user_sub }, collection );

    body = {
      status: statusCode,
      description: "Successful request",
      payload: {
        identifier: collection.identifier
      }
    };

  } catch (err) {
    console.log(err);
    statusCode = 500;
    body = {
      status: statusCode,
      description: 'Internal server error',
    };
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