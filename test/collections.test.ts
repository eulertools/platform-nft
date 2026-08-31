import * as getCollection from '../src/platform-apis-handler/collection/get';
import * as getCollectionByAddress from '../src/platform-apis-handler/collection/get-by-address';
import * as getCollectionMe from '../src/platform-apis-handler/collection/get-me';
import * as postSearchCollection from '../src/platform-apis-handler/collection/post-search';
import * as put_collection from '../src/platform-apis-handler/collection/put';
import * as post_collection from '../src/platform-apis-handler/collection/post';

const fs = require('fs');
const path = require('path');

const evalMethod = async (handler:any,event:any, context:any, callback:any, done:any, expectStatus:number):Promise<string> => {
  try {
    const { statusCode, body } = await handler(event, context, callback);
    expect(statusCode).toEqual(expectStatus);
    done();
    return body;
  } catch (e) {
    done.fail(e);
    return '';
  }
}

describe('COLLECTION API', () => {

  let headers:any;

  beforeAll(() => {
    jest.setTimeout(10000);
    headers =  {
      referer: 'http://localhost:8080'
    }
  });
  
  it('POST /collection/${identifier}', async (done) => {

    const banner = "data:image/png;base64," + fs.readFileSync(path.resolve(__dirname,'resources/collection_banner.png'), 'base64');
    const image = "data:image/png;base64," + fs.readFileSync(path.resolve(__dirname,'resources/collection_image.png'), 'base64');

    const event = {
        resource: '/collection/${identifier}',
        httpMethod: 'POST',
        headers,
        body: JSON.stringify({
          blockchain: 'bsc',
          address: '0xfa9b79769adc9bc9684d770586ed0a3a1074139d',
          owner: '0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B',
          name: 'BNB Event',
          symbol: 'EULERBOOK',
          description: 'Default collection of events in BNB Chain',
          kind: 'event',
          banner,
          image
        }),
        requestContext: {
          authorizer: {
            claims: {
              sub: 'default'
            }
          }
        }
    };
    const context = {};
    const callback = {};

    await evalMethod(post_collection.handler, event, context, callback, done, 200);
    done();
  });

  // it('PUT /collection/${identifier}', async (done) => {

  //   const banner = "data:image/png;base64," + fs.readFileSync(path.resolve(__dirname,'resources/collection_banner.png'), 'base64');
  //   const image = "data:image/png;base64," + fs.readFileSync(path.resolve(__dirname,'resources/collection_image.png'), 'base64');

  //   const event = {
  //       resource: '/collection/${identifier}',
  //       httpMethod: 'PUT',
  //       headers,
  //       pathParameters: { identifier: 'bsctest~0xfc87f5a90be1fdb73648ddb23e27d515442c6e9a' },
  //       body: JSON.stringify({
  //         name: 'BNB Testnet Event', 
  //       }),
  //       requestContext: {
  //         authorizer: {
  //           claims: {
  //             sub: 'default'
  //           }
  //         }
  //       }
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(put_collection.handler, event, context, callback, done, 200);
  // });

  //   it('GET /${blockchain}/collection/{addresss}', async (done) => {

  //   const event = {
  //       resource: '/${blockchain}/collection/{addresss}',
  //       httpMethod: 'GET',
  //       headers,
  //       pathParameters: { blockchain: 'bsctest', address: '0xfc87f5a90be1fdb73648ddb23e27d515442c6e9a' },
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(getCollectionByAddress.handler, event, context, callback, done, 200);
  // });

  //   it('GET /collection/{identifier}', async (done) => {

  //   const event = {
  //       resource: 'GET /collection/{identifier}',
  //       httpMethod: 'GET',
  //       headers,
  //       pathParameters: { identifier: 'bsctest~0xfc87f5a90be1fdb73648ddb23e27d515442c6e9a' },
  //       requestContext: {
  //       authorizer: {
  //           claims: {
  //             sub: 'bc7b9f74-5735-4818-aca9-fb50054679cf'
  //           }
  //         }
  //       },
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(getCollection.handler, event, context, callback, done, 200);
  // });

  //  it('GET /collection/me', async (done) => {

  //   const event = {
  //       resource: '/collection/me',
  //       httpMethod: 'GET',
  //       headers,
  //       requestContext: {
  //       authorizer: {
  //           claims: {
  //             sub: '59e5cb49-3520-4b7a-b488-c97ff0a3cfc4'
  //           }
  //         }
  //       },
  //       queryStringParameters: {
  //         limit: 2,
  //         lastIdentifier: 'bsctest~0xfc87f5a90be1fdb73648ddb23e27d515442c6e9a'
  //       }
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(getCollectionMe.handler, event, context, callback, done, 200);
  // });

  // it('POST /{blockchain}/collection/search', async (done) => {

  //   const event = {
  //       resource: '/{blockchain}/collection/search',
  //       httpMethod: 'POST',
  //       headers,
  //       body: JSON.stringify({
  //         "query":{
  //           "query": {
  //             "bool": {
  //               "must": [
  //                 {
  //                   "multi_match": {
  //                     "query": "BNB",
  //                     "fields": [
  //                       "address",
  //                       "name",
  //                       "description",
  //                       "kind"
  //                     ]
  //                   }
  //                 }
  //               ],
  //               "filter": [
  //                 {
  //                   "term": {
  //                     "blockchain": "bsctest"
  //                   }
  //                 }
  //               ]
  //             }
  //           }
  //         }
  //       }),
  //   };
  //   const context = {};
  //   const callback = {};

  //   await evalMethod(postSearchCollection.handler, event, context, callback, done, 200);
  // });
});

