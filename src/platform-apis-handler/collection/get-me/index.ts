import { getHeaders } from "../../utils/getHeaders";
import client from '/opt/nodejs/elasticsearch';

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {
    
    const user_sub = event.requestContext.authorizer.claims.sub;

    const size = event.queryStringParameters?.size || 16;
    const from = event.queryStringParameters?.from || 0;

    const baseQuery = {
      "query": {
        "bool": {
          "minimum_should_match": 1,
          "should": [
            {
              "match_phrase": {
                "user_sub": user_sub
              }
            },
            {
              "match_phrase": {
                "user_sub": "default"
              }
            }
          ]
        }
      }
    }

    const { hits } = (await client.search({
      index: 'platform_nft_collection_v1',
      body: {
        ...baseQuery,
        size,
        from
      },
    })).body;

    body = {
      total: hits.total.value,
      results: hits.hits.map((hit:any) => {
        delete hit._source.user_sub;
        return hit._source;
      })
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