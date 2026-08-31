import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";

async function search(user_sub:string, identifier: string) {

  let search:any = {
    TableName: process.env.TABLE_PLATFORM_NFT_COLLECTION,
    KeyConditionExpression: '#user_sub = :user_sub AND #identifier = :identifier',
    ExpressionAttributeNames:{
      '#user_sub': 'user_sub',
      '#identifier': 'identifier'
    },
    ExpressionAttributeValues: {
      ':user_sub': { S: user_sub },
      ':identifier': { S: identifier }
    }
  }

  const result = await DynamoDB.getItem(search);

  if(result) return result;

  search = {
    TableName: process.env.TABLE_PLATFORM_NFT_COLLECTION,
    KeyConditionExpression: '#user_sub = :user_sub AND #identifier = :identifier',
    ExpressionAttributeNames:{
      '#user_sub': 'user_sub',
      '#identifier': 'identifier'
    },
    ExpressionAttributeValues: {
      ':user_sub': { S: 'default' },
      ':identifier': { S: identifier }
    }
  }

  return await DynamoDB.getItem(search);
}

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const user_sub = event.requestContext.authorizer.claims.sub;
    const identifier = event.pathParameters.identifier;

    const result = await search(user_sub, identifier);
    
    if(result) {
      body = result;
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