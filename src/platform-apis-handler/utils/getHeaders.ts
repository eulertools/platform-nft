require('dotenv').config();

export const getHeaders = (event: any) => {

  let origin = event.headers?.origin;

  if(origin && origin.length > 0 && origin.slice(-1) === '/') origin = origin.slice(0, -1);

  let headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE,PATCH",
    "Access-Control-Allow-Credentials": true,
  };

  console.log('Allow-Origin', headers["Access-Control-Allow-Origin"]);

  return headers;
};
