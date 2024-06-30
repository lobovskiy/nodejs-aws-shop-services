import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import csv from 'csv-parser';
import * as yup from 'yup';
import { productSchema } from '../../src/schemas';
import { ICsvRow } from '../types';

export const s3Client = new S3Client({
  region: process.env.CDK_DEFAULT_REGION,
});

export async function getS3ObjectStreamingBlobPayload(
  bucketName: string,
  filePath: string
) {
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
  return new Promise<void>((resolve, reject) => {
    const csvRows: ICsvRow[] = [];
    const csvParser = stream.pipe(csv());

    csvParser
      .on('data', (data: ICsvRow) => {
        console.log('csv row: ', data);
        csvRows.push(data);
      })
      .on('end', async () => {
        console.log('File parsing completed');

        const rowValidationErrors: string[] = [];

        await Promise.all(
          csvRows.map((csvRow) =>
            productSchema
              .validate(csvRow, { abortEarly: false })
              .catch((err) => {
                const error = err as yup.ValidationError;

                rowValidationErrors.push(error.errors.join(', '));
              })
          )
        );

        if (rowValidationErrors.length > 0) {
          console.error(
            'File validation error:',
            rowValidationErrors.join('; ')
          );

          reject(new Error('Invalid csv data'));
        }

        resolve();
      })
      .on('error', (err: unknown) => {
        const error = err as Error;

        console.error('Error while parsing csv file: ', error.message);

        reject(error);
      });
  });
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
