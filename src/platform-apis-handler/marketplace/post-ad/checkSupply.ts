import client from '/opt/nodejs/elasticsearch';
import * as DynamoDB from '/opt/nodejs/dynamodb';
import { ValidationError } from 'src/platform-apis-handler/utils/validationError';

export const checkSupply = async (blockchain_name:string, base_token_address:string, base_token_id:string,
    base_token_quantity:number) => {

  const result = await DynamoDB.getItem({
    TableName: process.env.TABLE_PLATFORM_NFT,
    IndexName : 'platformNFTDynamoDB_blockchainIndex',
    KeyConditionExpression: '#contract = :contract AND #token_id = :token_id',
    ExpressionAttributeNames:{
        '#contract': 'contract',
        '#token_id': 'token_id',
        '#metadata': 'metadata',
    },
    ExpressionAttributeValues: {
      ':contract': { S: `${blockchain_name}~${base_token_address}` },
      ':token_id': { S: base_token_id } 
    },
    ProjectionExpression: '#metadata'
  });

  if(result) {

    const { aggregations } = (await client.search({
      index: 'marketplace_nft_v1',
      body: {
        aggs: {
          sum_quantity: {
            sum: {
              field: "base_token_quantity"
            }
          }
        },
        query: {
          bool:{
            filter:[
              {
                match_phrase: { blockchain_name }
              },
              {
                match_phrase: { base_token_address }
              },
              {
                match_phrase: { base_token_id }
              }
            ]
          }
        },
        _source: ['base_token_quantity']
      },
    })).body;

    if(Number.parseInt(result.metadata.settings.max_total_supply) <
       Number.parseInt(aggregations.sum_quantity.value) + base_token_quantity){
      throw new ValidationError(400, 'Exceeded the amount of ads', 'EXCEEDED_AMOUNT_ADS');
    }
  } else {
    throw new ValidationError(400, 'NFT does not exist in the catalog', 'NFT_NOT_EXIST');
  }
}