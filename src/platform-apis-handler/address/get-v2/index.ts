import axios from 'axios';
import { getHeaders } from "../../utils/getHeaders";
export async function handler(event: any, context: any, callback: any) {

  const Redis = require('ioredis');
  const redisEndpoint = process.env.REDIS_ENDPOINT!;
  const redisPort = process.env.REDIS_PORT!;
  const redis = new Redis({
    port: redisPort,
    host: redisEndpoint,
  });
  let statusCode = 200;
  let body;
  const headers = getHeaders(event);
  const size = event.queryStringParameters?.size! || 16;
  const page = parseInt(event.queryStringParameters?.page!) || 1;

  try {
    const address = event.pathParameters.address.toLowerCase();
    const chain = event.pathParameters.blockchain;
    let results:any = [];
    let cursor: string = ' ';
    let apiMoralis;
    let response;
    let cacheKey = `cache~${chain}~${address}`;
    let exist;
    const options = { 'x-api-key': process.env.MORALIS_API_KEY! };
    exist = await redis.get(cacheKey);

    if (!exist) {
      do{
      apiMoralis = `https://deep-index.moralis.io/api/v2/${address}/nft?chain=${chain}&format=decimal&cursor=${cursor}`
      response = await axios.get(apiMoralis, { headers: options });

      response.data.result = await Promise.all(response.data.result.map(async (nft: any) => {
        if (nft.token_uri && nft.token_uri.startsWith('ipfs://')) {
          nft.token_uri = "https://ipfs.io/ipfs/" + nft.token_uri.replace('ipfs://', '');
        }
        if (nft.metadata) {
          nft.metadata = JSON.parse(nft.metadata);
        } else if (nft.token_uri.startsWith('data:application/json')) {
          nft.metadata = JSON.parse(nft.token_uri.substring(nft.token_uri.indexOf('{')));
        } else {
          nft.metadata = (await axios.get(nft.token_uri)).data;
        }

        if (nft.metadata.image.includes('ipfs://'))
          nft.metadata.image = "https://ipfs.io/ipfs/" + nft.metadata.image.replace('ipfs://', '');

        if (!nft.name) nft.name = nft.metadata.name;

        return nft;
      }));
      
      results = results.concat(response.data.result)

      body = {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.page_size,
        cursor: response.data.cursor,
        results
      }
      cursor = body.cursor;
    }while(cursor);
    await redis.set(cacheKey, JSON.stringify(body), 'EX', (15 * 60))
    }
    else {
      body = JSON.parse(exist);
    }
  }
  catch (err) {
    console.log(err);
    statusCode = 500;
    body = {
      status: statusCode,
      description: 'Internal server error',
      error: err,
    };
  } finally {
    const from = (page - 1) * size
    const to = (page * size)
    body = {
      total: body.total,
      result: body.results.slice(from, to)
    }
    body = JSON.stringify(body);
    console.log({data: body});
  }
  return {
    statusCode,
    body,
    headers
  };
}
