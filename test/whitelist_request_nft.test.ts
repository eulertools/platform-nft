import * as post from '../src/platform-apis-handler/whitelist-request-nft/post'
import * as post_request_nft from '../src/platform-apis-handler/whitelist-request-nft/post-ticket-claim'
import web3Utils from "web3-utils";

const evalMethod = async (handler:any, event:any, context:any, callback:any, done:any, expectStatus:number):Promise<string> => {
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
describe('REQUEST NFT API', () => {

  let headers:any;

  beforeAll(() => {
    headers =  {
      referer: 'http://localhost:8080'
    }
  });

 it('POST /whitelist-request/{blockchain}/{address}/{token_id}', async (done) => {
    
    const event = {
      resource: '/ticket-claim/{blockchain}/{address}/{token_id}',
      httpMethod: 'POST',
      pathParameters: { 
        blockchain: 'polygontest', 
        address: '0x0db12648b1d326a1940a4407a111ab33ae72d473', 
        token_id: '29'
      },
      headers,
      requestContext: {
        authorizer: {
          claims: {
            sub: '3a775d06-3e4d-4db9-95ef-fc1e288b55ba'
          }
        }
      },
      body: JSON.stringify({
        "identifier": web3Utils.sha3("alejandro@euler.tools"),
        "regenerate": true
      }),
    };
    const context = {};
    const callback = {};

    evalMethod(post.handler, event, context, callback, done, 200);
  });

  // it('POST /ticket-claim/{blockchain}/{address}/{token_id}', async (done) => {
    
  //   const event = {
  //     resource: '/ticket-claim/{blockchain}/{address}/{token_id}',
  //     httpMethod: 'POST',
  //     pathParameters: { 
  //       blockchain: 'polygontest', 
  //       address: '0x0db12648b1d326a1940a4407a111ab33ae72d473', 
  //       token_id: '29'
  //     },
  //     headers,
  //     body: JSON.stringify({"identifier": "alejandro@euler.tools", "password": "PtjUgBDXP4ouoz"}),
  //   };
  //   const context = {};
  //   const callback = {};

  //   evalMethod(post_request_nft.handler, event, context, callback, done, 200);
  // });

  // it('POST /request-nft/{blockchain}/{address}/{token_id}/claim-words-zksnark', async (done) => {

  //     const event = {
  //       resource: '/request-nft/{blockchain}/{address}/{token_id}/claim-words-zksnark',
  //       httpMethod: 'POST',
  //       pathParameters: { 
  //         blockchain: 'bsctest', 
  //         address: '0x09d07ab0f4ced217fdec6ed4506c587655e940f4', 
  //         token_id: '0',
  //         kind_claim: 'claim-words'
  //       },
  //       headers,
  //       body: JSON.stringify({
  //         claim_words: 'EULERTOTHEMOON',
  //         receiver: '0x35c223fEfa0724E99adf6aDc8Bc43Ed48693d0cf'
  //       }),
  //   };
  //   const context = {};
  //   const callback = {};

  //   evalMethod(post_request_nft.handler, event, context, callback, done, 200);
  // });
});

