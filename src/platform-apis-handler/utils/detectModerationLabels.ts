const AWS = require('aws-sdk')

const rekognition = new AWS.Rekognition();

export const detectModerationLabels = async (bucket:any, threshold:number) => {
  
  const params = {
    Image: {
      S3Object: {
        Bucket: bucket.name,
        Name: bucket.path,
      }
    }
  };

  const response = await rekognition.detectModerationLabels(params).promise();

  return response.ModerationLabels.filter((moderation:any) => moderation.Confidence >= threshold);
}