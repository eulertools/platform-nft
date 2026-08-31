import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as DynamoDB from "/opt/nodejs/dynamodb";

const AWS = require('aws-sdk');

var mimeDB = require('mime-db');

const S3 = new S3Client({});

export async function handler(event:any) {

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": event.headers.origin,
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE,PATCH",
    "Access-Control-Allow-Credentials": true,
  };

  const parseBody = JSON.parse(event.body);

  const { contentType } = parseBody;

  if (!contentType) {
    return {
      statusCode: 400,
      body: "Bad request"
    };
  }

  const extension = mimeDB[contentType]?.extensions[0];

  const user_sub = event.requestContext.authorizer.claims.sub;

  const identifier = AWS.util.uuid.v4();

  const startPath:string = process.env.START_PATH ? process.env.START_PATH as string : "tmp";

  const path = `${startPath}/${user_sub}/${AWS.util.uuid.v4()}.${extension}`;

  const signedUrl = await getSignedUrl(
    S3,
    new PutObjectCommand({ 
      Bucket: process.env.BUCKET_NAME, 
      Key: path,
      ContentType: contentType,
      Metadata: {
        "user_sub": user_sub
      }
    }),
    { expiresIn: 60 * 5 }
  );
  
  const key = {
    user_sub,
    identifier
  }

  const value = {
    bucket: {
      name: process.env.BUCKET_NAME,
      path
    },
    content_type: contentType,
    extension,
    create_date: new Date().toISOString()
  }

  await DynamoDB.updateItem(process.env.TABLE_NAME, key, value );

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      identifier,
      presigned_url: signedUrl.toString() 
    }),
    headers
  };
}
