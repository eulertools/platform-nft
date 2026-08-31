import { handler } from "../src/validation-nft/";

describe('Rekognition', () => {

    let event:any;

    beforeAll(() => {

        require('dotenv').config();
    
        jest.setTimeout(250000);
        event = {
          Records:[
            {
              body: JSON.stringify({
                user_sub: 'add70571-448d-432b-95c5-2bea40d0ffff',
                identifier: 'f01220ec-33be-4bbe-af8b-0c4acee495be',
                bucket: 'platform-api-nft-cdn-sta-nftassetsbucketoutputabc-1lp775ic9gdsy',
                path: 'nft/f01220ec-33be-4bbe-af8b-0c4acee495be/yoga.jpg'
              })
            }
          ]
        }
      });
    
      it('execute', async (done) => {
        try {
          await handler(event);
          done();
        } catch (e) {
          done.fail(e)
        }
      });
});