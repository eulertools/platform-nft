import { getHeaders } from "../../utils/getHeaders";
import client from '/opt/nodejs/elasticsearch';

export async function handler(event: any, context: any, callback: any) {

  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const identifier = event.pathParameters?.identifier;
    
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
          "ad_signature",
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
    
    body = {
      total: hits.total.value,
      results: hits.hits[0]._source
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
