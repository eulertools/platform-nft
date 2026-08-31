import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const identifier = event.pathParameters.identifier

    const result = await DynamoDB.getItem({
      TableName: process.env.TABLE_PLATFORM_NFT,
      IndexName: 'platformNFTDynamoDB_identifierIndex',
      KeyConditionExpression: "#identifier = :identifier",
      ExpressionAttributeNames:{
          "#identifier": "identifier"
      },
      ExpressionAttributeValues: {
          ":identifier": { S: identifier }
      }
    });

    if(result) {
      body = result.metadata;
    } else {
      statusCode = 404;
      body = {
        status: statusCode,
        description: 'Not found',
      };
    }
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