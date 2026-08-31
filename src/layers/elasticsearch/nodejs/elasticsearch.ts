import { Client } from '@elastic/elasticsearch';

require('dotenv').config();

const node = `https://${process.env.OS_DOMAIN as string}`

const client = new Client({
  nodes: [ node ],
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: false,
  auth: {
    username: process.env.OS_USER as string,
    password: process.env.OS_PASSWORD as string
  }
});

export default client;