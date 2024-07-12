import { randomUUID } from 'node:crypto';
import { Readable } from 'stream';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import csv from 'csv-parser';

import { productSchema } from '../../src/schemas';
import { URL_EXPIRATION_TIME_IN_SECONDS } from '../consts';

export const s3Client = new S3Client({
  region: process.env.CDK_DEFAULT_REGION,
});

const sqsClient = new SQSClient({
  region: process.env.CDK_DEFAULT_REGION,
});

export async function getS3UploadSignedUrl(
  bucketName: string,
  objectKey: string
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: 'text/csv',
  });
  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: URL_EXPIRATION_TIME_IN_SECONDS,
  });

  return signedUrl;
}

export async function getS3ObjectStreamingBlobPayload(
  bucketName: string,
  filePath: string
): Promise<Readable> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: filePath,
  });

  try {
    const { Body } = await s3Client.send(command);

    if (!Body || !(Body instanceof Readable)) {
      const error = new Error('Requested file is empty or corrupted');

      console.error(error.message);

      throw error;
    }

    return Body;
  } catch (err: unknown) {
    const error = err as Error;

    console.error(
      'Error while getting S3 streaming blob payload: ',
      error.message
    );

    throw error;
  }
}

export async function parseCsvFile(stream: Readable) {
  const csvStream = stream.pipe(csv());

  for await (const chunk of csvStream) {
    try {
      productSchema.validateSync(chunk);
    } catch (error) {
      console.error('File validation error: ', error);

      continue;
    }

    const command = new SendMessageCommand({
      QueueUrl: process.env.PRODUCTS_QUEUE_URL,
      MessageBody: JSON.stringify(chunk),
      MessageGroupId: 'products',
      MessageDeduplicationId: randomUUID(),
    });

    try {
      await sqsClient.send(command);
    } catch (err) {
      const error = err as Error;

      console.error(
        'Error while sending query message during parsing csv file: ',
        error.message
      );
    }
  }

  console.log('File parsing process finished');
}

export async function moveS3Object(
  sourceBucketName: string,
  sourceObjectPath: string,
  destinationBucketName: string,
  destinationObjectPath: string
) {
  try {
    const copyCommand = new CopyObjectCommand({
      Bucket: destinationBucketName,
      CopySource: `/${sourceBucketName}/${sourceObjectPath}`,
      Key: destinationObjectPath,
    });
    const deleteCommand = new DeleteObjectCommand({
      Bucket: sourceBucketName,
      Key: sourceObjectPath,
    });

    await s3Client.send(copyCommand);
    console.log(
      `File copied from /${sourceBucketName}/${sourceObjectPath} to /${destinationBucketName}/${destinationObjectPath}`
    );

    await s3Client.send(deleteCommand);
    console.log(`File deleted from /${sourceBucketName}/${sourceObjectPath}`);
  } catch (err: unknown) {
    const error = err as Error;

    console.error('Error while moving S3 object: ', error.message);

    throw error;
  }
}
