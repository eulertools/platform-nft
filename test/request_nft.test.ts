import * as post_request_nft from '../src/platform-apis-handler/request-nft/post';
import * as get_request_nft from '../src/platform-apis-handler/request-nft/get';
import GuestbookSDK from '../src/platform-apis-handler/request-nft/post/guestbookSDK';
import whitelist from './resources/whitelist';

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

  // it('GET /request-nft/{blockchain}/{address}/{token_id}/receiver/{receiver}', async (done) => {

  //   const event = {
  //       resource: '/request-nft/{blockchain}/{address}/{token_id}/receiver/{receiver}',
  //       httpMethod: 'GET',
  //       pathParameters: { 
  //         blockchain: 'bsctest', 
  //         address: '0xfc87f5a90be1fdb73648ddb23e27d515442c6e9a', 
  //         token_id: '-2',
  //         receiver: '0x4a9e0fcdd826af2b235c69fc4e2ee03cdbb82632'
  //       },
  //       headers
  //   };
  //   const context = {};
  //   const callback = {};
  
  //   evalMethod(get_request_nft.handler, event, context, callback, done, 200);
  // });

  // it('POST /request-nft/{blockchain}/{address}/{token_id}/claim-words', async (done) => {
    
  //   const event = {
  //     resource: '/request-nft/{blockchain}/{address}/{token_id}/claim-words',
  //     httpMethod: 'POST',
  //     pathParameters: { 
  //       blockchain: 'bsc', 
  //       address: '0xb5b2cb9f1da6efe7ba48ea267f0cb39d11a9d6cb', 
  //       token_id: '1',
  //       kind_claim: 'claim-words'
  //     },
  //     headers,
  //     body: JSON.stringify({"claim_words": "BNBCHAINTURKEY", "receiver": "0x4884a0409f5f3748a3dfd3fd662199cdc6b01b2b"}),
  // };
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

  it('POST /{blockchain}/request-nft/{address}/{token_id}/ticket-hash', async (done) => {
    
    const event = {
      resource: '{blockchain}/request-nft/{address}/{token_id}/ticket-hash',
      httpMethod: 'POST',
      pathParameters: { 
        blockchain: 'bsc', 
        address: '0xb4d03843ea821cb1892c5163c37f196073df5288', 
        token_id: '42',
        kind_claim: 'ticket-hash'
      },
      headers,
      body: JSON.stringify({"ticketHash":"0xa0bc3bdb75fb6d5e79f2162a9f6e506e15ea277492503788a2a1415a821d5a79","signatureClaim":{
        "value": '¡Enhorabuena por tu premio! Haga click en firmar para reclamarlo.\\nAddress: 0x4884a0409f5f3748a3dFD3fD662199cDC6b01b2B',
        "signature": '0xadb6d64f5ff33594c6f1d7822fda54ab26c9405c3745a23d957c0f2fcfcb7fd2046e085ed7575929ef8e443dbc420fbc9d0321d3c92fc7166205a955a56346781b',
        "v": '0x1b',
        "r": '0xadb6d64f5ff33594c6f1d7822fda54ab26c9405c3745a23d957c0f2fcfcb7fd2',
        "s": '0x046e085ed7575929ef8e443dbc420fbc9d0321d3c92fc7166205a955a5634678'
      }}),
  };
    const context = {};
    const callback = {};

    evalMethod(post_request_nft.handler, event, context, callback, done, 200);
  });
});

