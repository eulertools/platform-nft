import Web3, { NetworkProvider } from "/opt/nodejs/web3";
import * as DynamoDB from "/opt/nodejs/dynamodb";
import { ValidationError } from "src/platform-apis-handler/utils/validationError";

export const ticketHash = async (rpc:any, nft:any, ticketHash:string, signatureClaim:any) => {

  let provider:any;

  try {

    const minter:any = JSON.parse(process.env.MINTER ? process.env.MINTER: '');

    const provider = new NetworkProvider(minter.privateKey.replace('0x',''), rpc);

    const web3 = Web3(provider);

    const result = await DynamoDB.getItem({
      TableName: process.env.TABLE_WHITELIST_REQUEST_NFT,
      IndexName : 'whitelistRequestNFT_ticketHashIndex',
      KeyConditionExpression: '#token_identifier = :token_identifier AND #ticket_hash = :ticket_hash',
      ExpressionAttributeNames:{
        '#token_identifier': 'token_identifier',
        '#ticket_hash': 'ticket_hash',
      },
      ExpressionAttributeValues: {
        ':token_identifier': { S: `${nft.blockchain}~${nft.address}~${nft.token_id}` },
        ':ticket_hash': { S: ticketHash } 
      }
    });

    if(result) {

      console.log(signatureClaim);

      const receiver = (await web3.eth.personal.ecRecover(signatureClaim.value, 
        signatureClaim.signature)).toLowerCase();

      const data = {
        tokenId: nft.token_id,
        identifier: ticketHash,
        receiver
      }

      const hash = web3.utils.sha3(web3.utils.encodePacked(
        {value: '0x19', type: 'bytes1'},
        {value: '0x0', type: 'bytes1'},
        {value: nft.address, type: 'address'},
        {value: data.tokenId, type: 'uint256'},
        {value: data.identifier, type: 'bytes32'},
        {value: data.receiver, type: 'address'}));

      const sign = (await web3.eth.personal.sign(hash, minter.address)).replace('0x', '');

      const r = `0x${sign.substring(0, 64)}`

      const s = `0x${sign.substring(64, 128)}`;
  
      const v = `0x${sign.substring(128, sign.length)}`;

      const signature = {
        value: hash,
        signature: `0x${sign}`,
        r,v,s
      }

      const signer = (await web3.eth.personal.ecRecover(signature.value, 
              signature.signature)).toLowerCase();

      if(signer !== minter.address.toLowerCase()) {
        throw new ValidationError(500, 'Invalid sign' , `INVALID_SIGNER: ${signer}~${minter.address.toLowerCase()}`);
      }
    
      return {
          data,
          signature
      }
    }
  } finally{
    if(provider) provider.engine.stop();
  }

  throw new ValidationError(400, 'Invalid ticket hash' , `INVALID_TICKET_HASH: ${nft.blockchain}~${nft.address}~${nft.token_id} - ${ticketHash}`);
}