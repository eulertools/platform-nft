import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const blockchain = event.pathParameters.blockchain;
    const address = event.pathParameters.address;

    let search:any = {
      TableName: process.env.TABLE_PLATFORM_NFT_COLLECTION,
      IndexName : 'platformNFTDynamoDB_blockchainIndex',
      KeyConditionExpression: '#blockchain = :blockchain AND #address = :address',
      ExpressionAttributeNames:{
        '#blockchain': 'blockchain',
        '#address': 'address',
        '#name': 'name',
        '#description': 'description',
        '#image': 'image',
        '#banner': 'banner',
        '#kind': 'kind',
      },
      ExpressionAttributeValues: {
        ':blockchain': { S: `${blockchain}` },
        ':address': { S: `${address}` }
      },
      ProjectionExpression: '#blockchain, #address, #name, #description, #image, #banner, #kind'
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