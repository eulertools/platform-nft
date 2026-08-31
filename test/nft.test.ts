import * as get_info from '../src/platform-apis-handler/nft/get-info';
import * as get_me from '../src/platform-apis-handler/nft/get-me';
import * as get_by_address from '../src/platform-apis-handler/nft/get-by-address';
import * as post_nft from '../src/platform-apis-handler/nft/post';
import * as put_nft from '../src/platform-apis-handler/nft/put';
import * as get_by_collection from '../src/platform-apis-handler/nft/post-search';
import * as get from '../src/platform-apis-handler/nft/get';
import * as delete_nft from '../src/platform-apis-handler/nft/delete';
import * as post_search from '../src/platform-apis-handler/nft/post-search';

const fs = require('fs');
const path = require('path');

const evalMethod = async (handler:any, event:any, context:any, callback:any, done:any, expectStatus:number):Promise<string> => {
  try {
    const { statusCode, body } = await handler(event, context, callback);
    console.log(body)
    expect(statusCode).toEqual(expectStatus);
    done();
    return body;
  } catch (e) {
    done.fail(e);
    return '';
  }
}

describe('NFT API', () => {

  let headers:any;

  beforeAll(() => {
    headers =  {
      referer: 'http://localhost:8080'
    }
  });

  //  it('GET /nft/me', async (done) => {

  //   const event = {
  //       resource: '/nft/me',
  //       httpMethod: 'GET',
  //       headers,
  //       requestContext: {
  //       authorizer: {
  //           claims: {
  //             sub: '59e5cb49-3520-4b7a-b488-c97ff0a3cfc4'
  //           }
  //         }
  //       }
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(get_me.handler, event, context, callback, done, 200);
  // });

  // it('GET /collection/{identifier}/nfts/me', async (done) => {

  //   const event = {
  //       resource: '/collection/{identifier}/nfts/me',
  //       httpMethod: 'GET',
  //       pathParameters: { identifier: 'bsctest~0xfc87f5a90be1fdb73648ddb23e27d515442c6e9a' },
  //       headers,
  //       requestContext: {
  //       authorizer: {
  //           claims: {
  //             sub: '59e5cb49-3520-4b7a-b488-c97ff0a3cfc4'
  //           }
  //         }
  //       }
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(get_me.handler, event, context, callback, done, 200);
  // });

  // it('GET /nft/{identifier}/info.json', async (done) => {

  //   const event = {
  //       resource: '/nft/{identifier}/info.json',
  //       httpMethod: 'GET',
  //       pathParameters: { identifier: '5d750ce0-3b36-41a5-905f-9cc4963082d0' },
  //       headers
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(get_info.handler, event, context, callback, done, 200);
  // });

  // it('GET /nft/{identifier}', async (done) => {

  //   const event = {
  //       resource: '/nft/{identifier}',
  //       httpMethod: 'GET',
  //       pathParameters: { identifier: '5d750ce0-3b36-41a5-905f-9cc4963082d0' },
  //       headers,
  //       requestContext: {
  //         authorizer: {
  //           claims: {
  //             sub: '59e5cb49-3520-4b7a-b488-c97ff0a3cfc4'
  //           }
  //         }
  //       }
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(get.handler, event, context, callback, done, 200);
  // });

  // it('POST /nft', async (done) => {

    // const image = "data:image/png;base64," + fs.readFileSync(path.resolve(__dirname,'./resources/nft_image.jpg'), 'base64');

  //   const event = {
  //       resource: '/nft',
  //       httpMethod: 'POST',
  //       headers,
  //       body: JSON.stringify({
  //         "blockchain":"bsctest",
  //         "address":"bsctest~0x4df88e9f6083572fb0cf59510299a1277928df30",
  //         "kind": "event",
  //         "collection": "bsctest~0x4df88e9f6083572fb0cf59510299a1277928df30",
  //         "metadata":{
  //             "name":"Event BNBChainES",
  //             "description":"Event of day 26th May in @BNBChainES",
  //             "image": "4081d440-ccfb-4394-90b5-c721f0dbfafa",
  //             "attributes": [
  //                   {
  //                     "display_type": "datetime", 
  //                     "trait_type": "Date From", 
  //                     "value": "1656266400000"
  //                   }, 
  //                   {
  //                     "display_type": "datetime", 
  //                     "trait_type": "Date To", 
  //                     "value": "1656266400000"
  //                   }, 
  //                   {
  //                     "trait_type": "Location", 
  //                     "value": "https://t.me/BNBChainES"
  //                   }, 
  //                 ]
  //             ,
  //             "settings":{
  //               "start_date_mint":1656266400000,
  //               "max_total_supply":2500,
  //               "end_date_mint":1659139200000
  //             }
  //         }
  //     }),
  //     requestContext: {
  //       authorizer: {
  //         claims: {
  //           sub: 'add70571-448d-432b-95c5-2bea40d0ffff'
  //         }
  //       }
  //     }
  //   };
  //   const context = {};
  //   const callback = {};

  //   // console.log(event.body);

  //   evalMethod(post_nft.handler, event, context, callback, done, 200);
  // });

  // it('POST /nft', async (done) => {

  //   const image = "data:image/png;base64," + fs.readFileSync(path.resolve(__dirname,'./resources/nft_bad_content.jpg'), 'base64');

  //   const event = {
  //       resource: '/nft',
  //       httpMethod: 'POST',
  //       headers,
  //       body: JSON.stringify({
  //         "blockchain":"bsctest",
  //         "address":"bsctest~0x4df88e9f6083572fb0cf59510299a1277928df30",
  //         "kind": "event",
  //         "collection": "bsctest~0x4df88e9f6083572fb0cf59510299a1277928df30",
  //         "metadata":{
  //             "name":"Event BNBChainES",
  //             "description":"Event of day 26th May in @BNBChainES",
  //             image,
  //             "attributes": [
  //                   {
  //                     "display_type": "datetime", 
  //                     "trait_type": "Date From", 
  //                     "value": "1656266400000"
  //                   }, 
  //                   {
  //                     "display_type": "datetime", 
  //                     "trait_type": "Date To", 
  //                     "value": "1656266400000"
  //                   }, 
  //                   {
  //                     "trait_type": "Location", 
  //                     "value": "https://t.me/BNBChainES"
  //                   }, 
  //                 ]
  //             ,
  //             "settings":{
  //               "start_date_mint":1656266400000,
  //               "max_total_supply":2500,
  //               "end_date_mint":1659139200000
  //             }
  //         }
  //     }),
  //     requestContext: {
  //       authorizer: {
  //         claims: {
  //           sub: '3a775d06-3e4d-4db9-95ef-fc1e288b55ba'
  //         }
  //       }
  //     }
  //   };
  //   const context = {};
  //   const callback = {};

  //   // console.log(event.body);

  //   evalMethod(post_nft.handler, event, context, callback, done, 400);
  // });

  // it('PUT /nft/{identifier}', async (done) => {

  //   const event = {
  //     resource: '/nft/{identifier}',
  //     httpMethod: 'PUT',
  //     headers,
  //     pathParameters: { identifier: '95c28cf2-e60b-4ed2-a49d-cf2336aa8a0a' },
  //     body: JSON.stringify({
  //       "token_id": "0",
  //       "metadata": {

  //       }
  //     }),
  //     requestContext: {
  //       authorizer: {
  //         claims: {
  //           sub: '3a775d06-3e4d-4db9-95ef-fc1e288b55ba'
  //         }
  //       }
  //     }
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(put_nft.handler, event, context, callback, done, 200);
  // });

  // it('GET /nft/blockchain/{chain}/{address}/{token_id}/info.json', async (done) => {

  //   const event = {
  //       resource: '/nft/blockchain/{chain}/{address}/{token_id}/info.json',
  //       httpMethod: 'GET',
  //       pathParameters: { blockchain: 'bsctest', address: '0xfc87f5a90be1fdb73648ddb23e27d515442c6e9a', token_id: '-2' },
  //       headers
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(get_by_address.handler, event, context, callback, done, 200);
  // });

  // it('GET /nft/blockchain/{chain}/{address}/{token_id}/info.json', async (done) => {

  //   const event = {
  //       resource: '/nft/blockchain/{chain}/{address}/{token_id}/info.json',
  //       httpMethod: 'GET',
  //       pathParameters: { blockchain: 'bsctest', address: '0xfc87f5a90be1fdb73648ddb23e27d515442c6e9a', token_id: '-2' },
  //       headers
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(get_by_address.handler, event, context, callback, done, 200);
  // });

  // it('GET /{blockchain}/nft/{address}/{token_id}', async (done) => {

  //   const event = {
  //     resource: '/{blockchain}/nft/{address}/{token_id}',
  //       httpMethod: 'GET',
  //       pathParameters: { blockchain: 'eth', address: '0x892848074ddea461a15f337250da3ce55580ca85', token_id: '9366' },
  //       headers
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(get_by_address.handler, event, context, callback, done, 200);
  // });

  // it('DELETE /nft/{identifier}', async (done) => {

  //   const eventPost = {
  //     resource: '/nft',
  //     httpMethod: 'POST',
  //     headers,
  //     body: {
  //       "user_sub": "59e5cb49-3520-4b7a-b488-c97ff0a3cfc4",
  //       "collection": "bsctest~0xc0653f60859648e66b7c46ea8d0a8eb67988e718",
  //       "metadata": {
  //           "name": "Event BNBChainES",
  //           "description": "Event of day 26th May in @BNBChainES",
  //           "image": "https://assets.prod.euler.tools/tokens/nft/events/telegram/26_05_2022_BNBChainES/image.png",
  //           "attributes": {
  //               "location": "https://t.me/BNBChainES",
  //               "date_from": 1656266400000,
  //               "date_to": 1656280800000
  //           },
  //           "event": {
  //               "start_date_mint": 1656266400000,
  //               "end_date_mint": 1659139200000,
  //               "max_total_supply": 2500
  //           }
  //       },
  //       "blockchain": "bsctest",
  //       "address": "0xc0653f60859648e66b7c46ea8d0a8eb67988e718",
  //       "claim_words": "Hermandad del cangrejo"
  //     },
  //   };
  //   const context = {};
  //   const callback = {};

  //   const body = JSON.parse(await evalMethod(post_nft.handler, eventPost, context, callback, done, 200));

  //   const event = {
  //       resource: '/nft/{identifier}',
  //       httpMethod: 'DELETE',
  //       pathParameters: { identifier: body.payload.identifier },
  //       headers,
  //       requestContext: {
  //         authorizer: {
  //           claims: {
  //             sub: '59e5cb49-3520-4b7a-b488-c97ff0a3cfc4'
  //           }
  //         }
  //       }
  //   };

  //   await evalMethod(delete_nft.handler, event, context, callback, done, 200);
  // });

  // it('POST /nft/search', async (done) => {

  //   const event = {
  //       resource: '/nft/search',
  //       httpMethod: 'POST',
  //       headers,
  //       body: JSON.stringify({
  //         "query":{
  //           "query":{
  //               "match_phrase":{
  //                   "contract":"polygontest~0x0db12648b1d326a1940a4407a111ab33ae72d473"
  //               }
  //           }
  //         },
  //         sort:[{
  //           "metadata.order": { order: 'ASC'}
  //         }]
      
  //       }),
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(post_search.handler, event, context, callback, done, 200);
  // });
});

