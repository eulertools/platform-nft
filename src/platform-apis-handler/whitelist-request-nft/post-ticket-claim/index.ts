import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";
import web3Utils from 'web3-utils';

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const { blockchain, token_id } = event.pathParameters;

    const address = event.pathParameters.address.toLowerCase();

    const bodyParse = JSON.parse(event.body);

    const { identifier, password } = bodyParse;

    const search:any = {
      TableName: process.env.TABLE_WHITELIST_REQUEST_NFT,
      KeyConditionExpression: '#token_identifier = :token_identifier AND #identifier = :identifier',
      ExpressionAttributeNames:{
        '#token_identifier': 'token_identifier',
        '#identifier': 'identifier',
        '#password': 'password',
        '#salt': 'salt',
        '#ticket_hash': 'ticket_hash'
      },
      ExpressionAttributeValues: {
        ':token_identifier': { S: `${blockchain}~${address}~${token_id}` },
        ':identifier': { S: identifier }
      },
      ProjectionExpression: '#password, #salt, #ticket_hash'
    }

    const result = await DynamoDB.getItem(search);
  
    if(result && web3Utils.sha3(password + result.salt) === result.password) {
      console.log(result);

      body = {
        status: statusCode,
        description: "Successful request",
        payload: {
          ticket_hash: result.ticket_hash
        }
      };
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