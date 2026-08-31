import * as get_address from "../src/platform-apis-handler/address/get/index";
import * as get_addressV2 from "../src/platform-apis-handler/address/get-v2/index";

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

describe('Address', () => {

  let headers:any;

  beforeAll(() => {
    jest.setTimeout(10000);
    headers =  {
      referer: 'http://localhost:8080'
    }
  });
  

  it('Get nfts by address', async (done) => {

    const event = {
      resource: '/${blockchain}/address/${address}',
      httpMethod: 'GET',
      pathParameters: { address: '0xc1f4fd1196953f0a70b2f368129c8a45fc88ae32', blockchain: 'bsc' },
      queryStringParameters:{size: '2', page:'1'},
      headers
    }

    const context = {};
    const callback = {};

    await evalMethod(get_address.handler, event, context, callback, done, 200);

    done();
  });

  it('Get nfts by address V2', async (done) => {
    const event = {
      resource: '/v2/{blockchain}/address/${address}',
      httpMethod: 'GET',
      pathParameters: { address: '0xc1f4fd1196953f0a70b2f368129c8a45fc88ae32', blockchain: 'bsc' },
      queryStringParameters:{size: '2', page:'1'},
      headers
    }

    const context = {};
    const callback = {};

    await evalMethod(get_addressV2.handler, event, context, callback, done, 200);

    done();
  });
});
