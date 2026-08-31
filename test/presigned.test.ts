import * as create_presigned from "../src/extra/api-s3-presigned/"

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

describe('Presigned url', () => {

  let headers:any;

  beforeAll(() => {
    jest.setTimeout(10000);
    headers =  {
      referer: 'http://localhost:8080'
    }
  });
  

  it('test', async (done) => {

    const event = {
      resource: '/presigned',
      httpMethod: 'POST',
      headers,
      body: JSON.stringify({ contentType: 'image/png'}),
      requestContext: {
        authorizer: {
          claims: {
            sub: '3a775d06-3e4d-4db9-95ef-fc1e288b55ba'
          }
        }
      }
    }

    const context = {};
    const callback = {};

    require('dotenv').config();

    await evalMethod(create_presigned.handler, event, context, callback, done, 200);

    done();
  });
});