import * as DynamoDB from "/opt/nodejs/dynamodb";
import { getHeaders } from "../../utils/getHeaders";

export async function handler(event: any, context: any, callback: any) {

  console.log("Events: ", event);
  let body;
  let statusCode = 200;
  const headers = getHeaders(event);

  try {

    const identifier = event.pathParameters.identifier;
    const user_sub = event.requestContext.authorizer.claims.sub;

    await DynamoDB.deleteItem(process.env.TABLE_PLATFORM_NFT_COLLECTION, { user_sub, identifier });

    body = {
      status: statusCode,
      description: "Successful request",
    };

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