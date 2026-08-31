import { getHeaders } from "../../utils/getHeaders";
import axios from 'axios';

export async function handler(event: any, context: any, callback: any) {

  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {
    const address = event.pathParameters.address.toLowerCase();

    const cursor = event.queryStringParameters?.cursor || '';
    const size = event.queryStringParameters?.size || 16;

    const options = {'x-api-key' : process.env.MORALIS_API_KEY!};

    let apiMoralis = `https://deep-index.moralis.io/api/v2/${address}/nft?chain=bsc&format=decimal&limit=${size}&cursor=${cursor}`
    
    let response;

    response = await axios.get(apiMoralis,{headers:options});

    response.data.result = await Promise.all(response.data.result.map(async (nft:any) => {
      
      if(nft.token_uri && nft.token_uri.startsWith('ipfs://')) {
          nft.token_uri = "https://ipfs.io/ipfs/" + nft.token_uri.replace('ipfs://','');
      }

      if(nft.metadata) {
        nft.metadata = JSON.parse(nft.metadata);
      } else if(nft.token_uri.startsWith('data:application/json')) {
        nft.metadata = JSON.parse(nft.token_uri.substring(nft.token_uri.indexOf('{')));
      } else {
        nft.metadata = (await axios.get(nft.token_uri)).data;
      }
  
      if(nft.metadata.image.includes('ipfs://')) 
        nft.metadata.image = "https://ipfs.io/ipfs/" + nft.metadata.image.replace('ipfs://','');

      if(!nft.name) nft.name = nft.metadata.name;
      
      return nft;
    }));

    if(response) {
      body = {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.page_size,
        cursor: response.data.cursor,
        result: response.data.result,
      }
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
      description: 'Internal server error'
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
