import Web3 from "/opt/nodejs/web3";

const abi =[
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "receivers",
            "type": "address[]"
          }
        ],
        "internalType": "struct IGuestbookModel.Event",
        "name": "_event",
        "type": "tuple"
      }
    ],
    "name": "generateHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "_hash",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "canMint",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
]

const sign = async(rpc:any, privateKey:string, contract:string, data:any) => {
  
  const web3 = Web3(rpc);

  const hash = await web3.ext.readContract(contract, abi, 'generateHash', data);

  let signature = await web3.eth.accounts.sign(hash, privateKey);

  return {
      value: hash,
      signature: signature.signature,
      v: signature.v,
      r: signature.r,
      s: signature.s
  };
};

const canMint = async(rpc:any, contract:string, tokenId:string, account:string) => {
  
  const web3 = Web3(rpc);

  return await web3.ext.readContract(contract, abi, 'canMint', tokenId, account);
};

export default {
    sign,
    canMint
};
