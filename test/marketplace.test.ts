import * as post_ad from "../src/platform-apis-handler/marketplace/post-ad/index";
import * as get from "../src/platform-apis-handler/marketplace/post-search-ad/index";
import * as get_ad from "../src/platform-apis-handler/marketplace/get-ad/index";
import * as get_ad_buy from "../src/platform-apis-handler/marketplace/get-ad-buy/index";

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

describe('Marketplace', () => {

  let headers:any;

  beforeAll(() => {
    jest.setTimeout(10000);
    headers =  {
      referer: 'http://localhost:8080'
    }
  });

  it('POST /marketplace/ad', async (done) => {

    const event = {
        resource: '/marketplace/ad',
        httpMethod: 'POST',
        headers,
        body: JSON.stringify({
          "user_sub": "c998144d-f4a5-409c-bd12-ca93691d03e9",
          "signature": {
              "value": "0xabf3e680174d5994fbc92b203e7bcc6c82c049f523e6a359dd57564dc3f58ff3",
              "v": "0x1c",
              "r": "0x0ffe8ad71466b9bdb33aa93bcab50d0622654a9ec09dcf47a17e67145fa7c86f",
              "s": "0x239bdb51d9a24ba7a690ebd29116087ec2b60fefdece06fce1fabf190d7935fa"
          },
          "base_token_name": "paisaje_supply_10",
          "base_token_address": "0x9881481df34974c2cb17157ae3c3cd209831707f",
          "base_token_id": "115540776186829682179538218970689677199930016646310594916348377604677096332212",
          "base_token_quantity": 1,
          "quote_token_name": "BNB",
          "quote_token_symbol": "BNB",
          "quote_token_address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          "quote_token_quantity": 1,
          "close_date": 0,
          "blockchain_name": "bsctest",
          "blockchain_id": 97,
          "terms": "terms",
          "seller_wallet": "0x5b4233f2ad4a36dc7eb0e64abe7d092ef6326279"
      }),
      requestContext: {
        authorizer: {
          claims: {
            sub: 'c998144d-f4a5-409c-bd12-ca93691d03e9'
          }
        }
      }
    };
    const context = {};
    const callback = {};

    await evalMethod(post_ad.handler, event, context, callback, done, 200);
    done();
  });

  it('GET /marketplace/{identifier}', async (done) => {
    const event = {
        resource: '/marketplace/{identifier}',
        httpMethod: 'GET',
        pathParameters: { identifier: "6a331968-a2dd-4d82-a742-b1f7b71730a1" },
        headers
    };
    const context = {};
    const callback = {};

    await evalMethod(get_ad.handler, event, context, callback, done, 200);
  });

  it('GET /marketplace/ad/{identifier}/buy', async (done) => {
    const event = {
        resource: '/marketplace/ad/{identifier}/buy',
        httpMethod: 'GET',
        pathParameters: { identifier: "6a331968-a2dd-4d82-a742-b1f7b71730a1" },
        headers
    };
    const context = {};
    const callback = {};

    await evalMethod(get_ad_buy.handler, event, context, callback, done, 200);
  });
  
  it('POST /marketplace/get', async (done) => {

    const event = {
      resource: '/marketplace/get-ads',
      httpMethod: 'POST',
      headers,
      body: JSON.stringify({
                query:{
                  "query": {
                    "bool": {
                     "filter": [
                       {
                         "exists": {
                           "field": "blockchain_id"
                         }
                       }
                     ]
                   }
                 }
                }
              }),
          };
    const context = {};
    const callback = {};

    await evalMethod(get.handler, event, context, callback, done, 200);
  });
})
