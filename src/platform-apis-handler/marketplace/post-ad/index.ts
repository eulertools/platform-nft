import * as DynamoDB from "/opt/nodejs/dynamodb";
import Web3 from "/opt/nodejs/web3";
import { getHeaders } from "../../utils/getHeaders";
import utils from 'web3-utils';
import { ValidationError } from "src/platform-apis-handler/utils/validationError";
import { checkSupply } from "./checkSupply";
const AWS = require('aws-sdk');

require('dotenv').config();

const generateHash = (data: any) =>
  utils.sha3(utils.encodePacked(
    { value: '0x19', type: 'bytes1' },
    { value: '0x0', type: 'bytes1' },
    { value: data.token, type: 'address' },
    { value: data.token_id, type: 'uint256' },
    { value: data.price, type: 'uint112' },
    { value: data.buyToken, type: 'address' },
    { value: data.amount, type: 'uint112' },
    { value: data.expirationDate, type: 'uint32' },
  ) as string,
);

const abiDecimals = [{
  "inputs": [],
  "name": "decimals",
  "outputs": [
    {
      "internalType": "uint8",
      "name": "",
      "type": "uint8"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}];

export async function handler(event: any) {

  let body: any;
  let statusCode = 200;
  const headers = getHeaders(event);
  try {

    console.log(event.body);

    const user_sub = event.requestContext.authorizer.claims.sub;

    let { signature, blockchain_name, blockchain_id, base_token_address, base_token_id,
      base_token_name, base_token_quantity,quote_token_name, quote_token_symbol,
      quote_token_address, quote_token_quantity, close_date, terms, seller_wallet
    } = JSON.parse(event.body);

    const rpc = process.env.BLOCKCHAIN_RPCS ? JSON.parse(process.env.BLOCKCHAIN_RPCS)[blockchain_name] : undefined;

    const web3 = Web3(rpc);

    const hash = signature.value;

    let decimals = 18;

    await checkSupply(blockchain_name, base_token_address, base_token_id, base_token_quantity);

    if(quote_token_address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      decimals = await web3.ext.readContract(quote_token_address, abiDecimals, 'decimals').catch(() => {
        throw new ValidationError(400, 'Invalid quote token', 'NOT_VALID_ERC20');
      });
    }

    const data = {
      token: base_token_address,
      token_id: base_token_id,
      price: (quote_token_quantity * (10 ** decimals)).toString(),
      buyToken: quote_token_address,
      amount: base_token_quantity,
      expirationDate: close_date
    }

    const controlHash = generateHash(data);
    
    if(hash !== controlHash) throw new ValidationError(400, "Invalid hash", "INVALID_HASH");

    const address_signature = await (web3.eth.accounts.recover(hash, 
      `${signature.r}${signature.s.replace('0x', '')}${signature.v.replace('0x', '')}`)).toLowerCase();

    if(address_signature !== seller_wallet.toLowerCase()) throw new ValidationError(400, "Invalid signature", "INVALID_SIGNATURE");

    const key:any = {
      user_sub,
      identifier: AWS.util.uuid.v4(),
    }
    
    const value:any = {
      ...key,
      ad_signature: {
        v: signature.v,
        r: signature.r,
        s: signature.s,
        value: signature.value,
      },
      seller_wallet: address_signature,
      base_token_name: base_token_name,
      base_token_address: base_token_address.toLowerCase(),
      base_token_id: base_token_id,
      base_token_quantity: base_token_quantity,
      quote_token_name: quote_token_name,
      quote_token_symbol: quote_token_symbol,
      quote_token_address: quote_token_address.toLowerCase(),
      quote_token_quantity: quote_token_quantity,
      close_date: close_date,
      create_date: new Date().toISOString(),
      update_date: new Date().toISOString(),
      blockchain_name: blockchain_name,
      blockchain_id,
      terms,
      user_sub: user_sub
    };

    console.log(await DynamoDB.updateItem(process.env.TABLE_PLATFORM_NFT_MARKETPLACE,
      key, value));

    body = {
      status: statusCode,
      description: "Successful request",
      payload: {
        identifier: key.identifier
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

