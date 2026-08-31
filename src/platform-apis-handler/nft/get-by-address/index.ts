import { getHeaders } from "../../utils/getHeaders";
import axios from 'axios';
import * as abi from './abi';
import Web3 from "/opt/nodejs/web3";
import * as DynamoDB from "/opt/nodejs/dynamodb";

require('dotenv').config();

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  console.log(process.env.COGNITO_POOL);

  try {

    const { blockchain, token_id } = event.pathParameters

    const address = event.pathParameters.address.toLowerCase();

    const result = await DynamoDB.getItem({
      TableName: process.env.TABLE_PLATFORM_NFT,
      IndexName : 'platformNFTDynamoDB_blockchainIndex',
      KeyConditionExpression: '#contract = :contract AND #token_id = :token_id',
      ExpressionAttributeNames:{
          '#contract': 'contract',
          '#token_id': 'token_id',
          '#blockchain': 'blockchain',
          '#address': 'address',
          '#metadata': 'metadata',
          '#kind': 'kind',
          '#token_uri': 'token_uri'
      },
      ExpressionAttributeValues: {
        ':contract': { S: `${blockchain}~${address}` },
        ':token_id': { S: token_id } 
      },
      ProjectionExpression: '#blockchain, #address, #token_id, #metadata, #kind, #token_uri'
    });

    if(result) {

      if(result.kind === 'event' || result.kind === 'event-zksnark') result.claim_words = 'ENABLED';

      body = result;

    } else {

      const rpc = process.env.BLOCKCHAIN_RPCS ? JSON.parse(process.env.BLOCKCHAIN_RPCS)[blockchain] : undefined ;

      if(rpc) {

        try {
          const web3 = Web3(rpc);

          let url;
          try {
            url = await web3.ext.readContract(address, abi.erc721, 'tokenURI', token_id);
          } catch(e) {
              url = await web3.ext.readContract(address, abi.erc1155, 'uri', token_id);
          }

          let response;

          if(url.startsWith('data:application/json')) {
            response = JSON.parse(url.substring(url.indexOf('{')));
          } else {

            if(url && url.startsWith('ipfs://')) {
              url = "https://ipfs.io/ipfs/" + url.replace('ipfs://','');
            }

            response = (await axios.get(url)).data;
          }

          if(response.image.includes('ipfs://')) 
            response.image = "https://ipfs.io/ipfs/" + response.image.replace('ipfs://','');

          body = {
            blockchain: blockchain,
            address: address,
            token_id,
            kind: 'other',
            token_uri: url,
            metadata: response,
          };

        } catch(e) {
          console.log(e);
          statusCode = 404;
          body = {
            status: statusCode,
            description: 'Not found',
          };
        }
          
      } else {
        statusCode = 400;
        body = {
          status: statusCode,
          description: 'Undefined network',
        };
      }
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