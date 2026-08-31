import { SQSEvent } from 'aws-lambda';
import { detectModerationLabels } from './detectModerationLabels';
import * as DynamoDB from "/opt/nodejs/dynamodb";

export const handler = async (event: SQSEvent) => {

  console.log({ message: 'Retrieving records from the SQS Queue' });
  console.log({ message: 'Records', data: event.Records });

  for (const record of event.Records) {
    try {

      const { user_sub, identifier, bucket, path } = JSON.parse(record.body);

      const result = await detectModerationLabels({ name:bucket, path }, 
        Number.parseInt(process.env.THRESHOLD_MODERATION as string));

      const validation = (result.length > 0) ? 'NOT_VALID' : 'VALID';

      const key = {
        user_sub, 
        identifier
      }

      const value = {
        ...key,
        validation
      }

      await DynamoDB.updateItem(process.env.TABLE_PLATFORM_NFT,key, value);
  
    } catch (e) {
      console.error('Failed to process DynamoDB row');
      console.error(record);
      console.error(e);
    }
  }
};
