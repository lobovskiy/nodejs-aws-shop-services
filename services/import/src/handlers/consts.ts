import { S3Client } from '@aws-sdk/client-s3';

export const responseHeaders = {
  'Access-Control-Allow-Headers':
    'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Origin': '*',
};

export const s3Client = new S3Client({
  region: process.env.CDK_DEFAULT_REGION,
});
