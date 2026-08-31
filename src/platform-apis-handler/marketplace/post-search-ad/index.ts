import { getHeaders } from "../../utils/getHeaders";
import client from '/opt/nodejs/elasticsearch';

export async function handler(event: any, context: any, callback: any) {

  let body;
  let statusCode = 200;
  const headers = getHeaders(event);
  try {

    const parseBody = JSON.parse(event.body);
    
    const size = parseBody?.size || 16;
    const from = parseBody?.from || 0;
    const query = parseBody?.query || 0;

    const { hits } = (await client.search({
      index: 'marketplace_nft_v1',
      body: {
        ...query,
        size,
        from,
        _source: {
          excludes: [
            'ad_signature',
            'user_sub'
        ]},
      },
    })).body;

    body = {
      total: hits.total.value,
      results: hits.hits.map((hit:any) => {
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
