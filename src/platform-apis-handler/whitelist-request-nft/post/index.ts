import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";
import { ValidationError } from "src/platform-apis-handler/utils/validationError";
import web3Utils from "web3-utils";
import crypto from "crypto";

const generateHash = (data:any) =>
web3Utils.sha3(web3Utils.encodePacked(
  {value: '0x19', type: 'bytes1'},
  {value: '0x0', type: 'bytes1'},
  {value: data.blockchain, type: 'string'},
  {value: data.token, type: 'address'},
  {value: data.token_id, type: 'uint256'},
  {value: data.identifier, type: 'string'},
  {value: data.salt, type: 'address'},
) as string)

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const { blockchain, token_id } = event.pathParameters;

    const address = event.pathParameters.address.toLowerCase();

    const user_sub = event.requestContext.authorizer.claims.sub;

    const bodyParse = JSON.parse(event.body);

    const { identifier, regenerate } = bodyParse;

    const nft = await DynamoDB.getItem({
      TableName: process.env.TABLE_PLATFORM_NFT,
      IndexName : 'platformNFTDynamoDB_blockchainIndex',
      KeyConditionExpression: '#contract = :contract AND #token_id = :token_id',
      FilterExpression: "#user_sub = :user_sub",
      ExpressionAttributeNames:{
          '#contract': 'contract',
          '#token_id': 'token_id',
          '#user_sub': 'user_sub'
      },
      ExpressionAttributeValues: {
        ':contract': { S: `${blockchain}~${address}` },
        ':token_id': { S: token_id },
        ':user_sub': { S: user_sub } 
      },
      ProjectionExpression: '#contract, #token_id, #user_sub'
    });

    if(!nft) throw new ValidationError(400, 'INVALID_PARAMS','INVALID_PARAMS');

    const key = {
      token_identifier: `${blockchain}~${address}~${token_id}`,
      identifier: identifier
    }

    const register = await DynamoDB.getItem({
      TableName: process.env.TABLE_WHITELIST_REQUEST_NFT,
      KeyConditionExpression: '#token_identifier = :token_identifier AND #identifier = :identifier',
      ExpressionAttributeNames:{
        '#token_identifier': 'token_identifier',
        '#identifier': 'identifier',
        '#salt': 'salt',
        '#ticket_hash': 'ticket_hash'
      },
      ExpressionAttributeValues: {
        ':token_identifier': { S: `${blockchain}~${address}~${token_id}` },
        ':identifier': { S: identifier }
      },
      ProjectionExpression: '#salt, #ticket_hash'
    });

    const password = Array(14).fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
      .map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    
    let value;
    let salt;
    let ticket_hash;

    if(!register) {

      salt = '0x' + crypto.randomBytes(20).toString('hex');
    
      ticket_hash = generateHash({
        blockchain,
        token: address,
        token_id: token_id,
        identifier: identifier,
        salt
      });

      value = {
        ...key,
        blockchain: blockchain,
        address: address,
        token_id: token_id,
        salt,
        password: web3Utils.sha3(password + salt),
        ticket_hash,
        user_sub,
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
      }
    } else {

      if(regenerate !== true) throw new ValidationError(400, 'REGENERATION_NOT_INDICATED','REGENERATION_NOT_INDICATED');

      salt = register.salt;
      ticket_hash = register.ticket_hash;

      value = {
        ...key,
        password: web3Utils.sha3(password + salt),
        update_date: new Date().toISOString(),
      }
    }

    await DynamoDB.updateItem(process.env.TABLE_WHITELIST_REQUEST_NFT, key, value);

    body = {
      status: statusCode,
      description: "Successful request",
      payload: {
        identifier,
        ticket_hash,
        password
      }
    };

  } catch (err) {
    console.log(err);
    if(err instanceof ValidationError) {
      statusCode = err.statusCode;
      body = {
        status: statusCode,
        description: err.description,
      };
    } else {
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