import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";
import GuestbookSDK from './guestbookSDK';
import * as ZKSnarkSDK from './zksnark';
import { ticketHash } from "./ticketHash";
import { ValidationError } from "src/platform-apis-handler/utils/validationError";

require('dotenv').config();

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const minter:any = JSON.parse(process.env.MINTER ? process.env.MINTER: '');

    const { blockchain, token_id, kind_claim } = event.pathParameters;

    const address = event.pathParameters.address.toLowerCase();

    const bodyParse = JSON.parse(event.body);

    const rpc = process.env.BLOCKCHAIN_RPCS ? JSON.parse(process.env.BLOCKCHAIN_RPCS)[blockchain] : undefined ;

    if(rpc) {

      const result = await DynamoDB.getItem({
        TableName: process.env.TABLE_PLATFORM_NFT,
        IndexName : 'platformNFTDynamoDB_blockchainIndex',
        KeyConditionExpression: '#contract = :contract AND #token_id = :token_id',
        ExpressionAttributeNames:{
            '#contract': 'contract',
            '#token_id': 'token_id',
            '#kind': 'kind',
            '#token_uri': 'token_uri',
            '#signature': 'signature',
            '#blockchain': 'blockchain',
            '#address': 'address'
        },
        ExpressionAttributeValues: {
          ':contract': { S: `${blockchain}~${address}` },
          ':token_id': { S: token_id } 
        },
        ProjectionExpression: '#blockchain ,#address ,#token_id , #kind, #token_uri, #signature'
      });

      let secret = undefined;

      if(result?.token_uri && bodyParse.claim_words) {
        const data:any = {
          secret: bodyParse.claim_words,
          uri: result.token_uri
        }
  
        secret = await ZKSnarkSDK.generateHash(data);
      }

      if(result && result.kind === 'event' && kind_claim === 'claim-words' &&  
        secret && result.signature && result.signature.value === secret) {

        const receiver = bodyParse.receiver.toLowerCase();

        const data:any = {
          tokenId: token_id,
          receivers: [ receiver ]
        };

        if(await GuestbookSDK.canMint(rpc,address, token_id, minter.address)) {

          const signature = await GuestbookSDK.sign(rpc, minter.privateKey, address, data);

          const position = '0';

          const request = {
            token_identifier: `${blockchain}~${address}~${token_id}`,
            receiver,
            data,
            signature,
            position,
            authorized: minter.address
          }
        
          await DynamoDB.updateItem(process.env.TABLE_REQUEST_NFT,  
            {  
              token_identifier: request.token_identifier,
              receiver: request.receiver 
            },
            request 
          );

          body = {
            status: statusCode,
            description: "Successful request",
            payload: { data, signature, position }
          };

        } else {
          statusCode = 401;
          body = {
            status: statusCode,
            description: 'Unauthorized',
          };
        }

      } else if(result && result.kind === 'event-zksnark' && kind_claim === 'claim-words' &&  
        secret && result.signature && result.signature.value === secret) {

        const receiver = bodyParse.receiver.toLowerCase();

        const timestamp = Date.now();
  
        const { signature } = result;
    
        const proof = await ZKSnarkSDK.generateInput({ 
          secret, 
          timestamp, 
          token: address, 
          tokenId: token_id, 
          receiver,
          hash: signature.value 
        });

        const request = {
          token_identifier: `${blockchain}~${address}~${token_id}`,
          receiver,
          data: proof,
          signature
        }
      
        await DynamoDB.updateItem(process.env.TABLE_REQUEST_NFT,  
          {  
            token_identifier: request.token_identifier,
            receiver: request.receiver 
          },
          request 
        );
    
        body = {
          status: statusCode,
          description: "Successful request",
          payload: {
            data: proof,
            signature
          }
        };
      } else if(result && result.kind === 'awards' && kind_claim === 'ticket-hash' 
        && bodyParse.signatureClaim && bodyParse.ticketHash) {

        const payload = await ticketHash(rpc, result, bodyParse.ticketHash, bodyParse.signatureClaim);

        console.log(payload);

        body = {
          status: statusCode,
          description: "Successful request",
          payload
        };
        
      } else {
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
  } catch (err) {
    if(err instanceof ValidationError) {
      console.log(err);
      statusCode = err.statusCode;
      body = {
        status: statusCode,
        description: err.description,
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