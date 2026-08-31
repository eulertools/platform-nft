import client from '/opt/nodejs/elasticsearch';
import { getHeaders } from "../../utils/getHeaders";
import utils from 'web3-utils';
import { ValidationError } from "src/platform-apis-handler/utils/validationError";
import * as DynamoDB from "/opt/nodejs/dynamodb";
import Web3 from "/opt/nodejs/web3";

const generateHash = (data: any) =>
  utils.sha3(utils.encodePacked(
    { value: '0x19', type: 'bytes1' },
    { value: '0x0', type: 'bytes1' },
    { value: data.token, type: 'address' },
    { value: data.token_id, type: 'uint256' },
    { value: data.owner, type: 'address' },
    { value: data.uri, type: 'string' },
    { value: data.maxTotalSupply, type: 'uint112' },
    { value: data.startDate, type: 'uint48' },
    { value: data.endDate, type: 'uint48' },
  ) as string,
);

const sign = async(rpc:any, privateKey:string, data:any) => {
  
  const web3 = Web3(rpc);

  const hash = generateHash(data);

  let signature = await web3.eth.accounts.sign(hash, privateKey);

  return {
      value: hash,
      signature: signature.signature,
      v: signature.v,
      r: signature.r,
      s: signature.s
  };
};

export async function handler(event: any) {

  let body: any;
  let statusCode = 200;
  const headers = getHeaders(event);
  try {

    const identifier = event.pathParameters.identifier;
    const baseQuery = {
      "query": {
        "ids": {
          "values": [
            identifier
          ]
      }
    },
      "_source": {
        "excludes": [
          "user_sub"
        ]
      }
    }

    const { hits } = (await client.search({
      index: 'marketplace_nft_v1',
      body: {
        ...baseQuery,
      },
    })).body;

    const ad = hits.hits[0]._source;

    if(ad.close_date !== 0 && ad.close_date <= Date.now()) throw new ValidationError(400, 'Purchase already made', 'PURCHASE_ALREADY_MADE')

    const nft = await DynamoDB.getItem({
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
        ':contract': { S: `${ad.blockchain_name}~${ad.base_token_address}` },
        ':token_id': { S: ad.base_token_id } 
      },
      ProjectionExpression: '#blockchain, #address, #token_id, #metadata, #kind, #token_uri'
    });

    const parameters = {
      startDate: nft.metadata.settings.start_date_mint || 0,
      endDate: nft.metadata.settings.end_date_mint || 0,
      maxTotalSupply:  nft.metadata.settings.max_total_supply,
      uri: nft.token_uri,
      owner: ad.seller_wallet
    }

    const note = {
      expirationDate: ad.close_date.toString(),
      amount: ad.base_token_quantity.toString(),
      price: utils.toWei(ad.quote_token_quantity.toString()).toString(),
      tokenId: ad.base_token_id.toString(),
      buyToken: ad.quote_token_address,
      identifier: identifier
    }

    const rpc = process.env.BLOCKCHAIN_RPCS ? JSON.parse(process.env.BLOCKCHAIN_RPCS)[nft.blockchain] : undefined ;

    const minter:any = JSON.parse(process.env.MINTER ? process.env.MINTER: '');

    const signatureCreate = await sign(rpc, minter.privateKey, {
      token: nft.address,
      token_id: nft.token_id,
      ...parameters
    })

    body = {
      status: statusCode,
      description: "Successful request",
      payload: {
        token: nft.address,
        parameters,
        note,
        signatureCreate,
        signature: ad.ad_signature 
      }
    };

  } catch (err) {

    if(err instanceof  ValidationError) {
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
