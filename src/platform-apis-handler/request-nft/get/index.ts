import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const { blockchain, token_id } = event.pathParameters;

    const address = event.pathParameters.address.toLowerCase();

    const receiver = event.pathParameters.receiver.toLowerCase();

    const search:any = {
      TableName: process.env.TABLE_REQUEST_NFT,
      KeyConditionExpression: '#token_identifier = :token_identifier AND #receiver = :receiver',
      ExpressionAttributeNames:{
        '#token_identifier': 'token_identifier',
        '#receiver': 'receiver',
        '#data': 'data',
        '#signature': 'signature',
        '#position': 'position'
      },
      ExpressionAttributeValues: {
        ':token_identifier': { S: `${blockchain}~${address}~${token_id}` },
        ':receiver': { S: receiver }
      },
      ProjectionExpression: '#data, #signature, #position'
    }

    const result = await DynamoDB.getItem(search);
  
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