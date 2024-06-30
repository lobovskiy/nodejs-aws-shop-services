import { APIGatewayProxyResult, S3Event } from 'aws-lambda';

import { IMPORT_FOLDERS } from '../consts';
import { responseHeaders } from './consts';
import {
  getS3ObjectStreamingBlobPayload,
  moveS3Object,
  parseCsvFile,
} from './utils';

export const handler = async (
  event: S3Event
): Promise<APIGatewayProxyResult | void> => {
  console.log(
    `Handler "importFileParser" requested with event argument: ${JSON.stringify(event)}`
  );

  if (!event.Records || event.Records.length === 0) {
    console.error('No event records found');

    return;
  }

  const record = event.Records[0];
  const bucketName = record.s3.bucket.name;
  const filePath = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  try {
    const fileStream = await getS3ObjectStreamingBlobPayload(
      bucketName,
      filePath
    );

    try {
      await parseCsvFile(fileStream);
    } catch (err: unknown) {
      const error = err as Error;

      console.error('File parsing validation error: ', error.message);

      return;
    }

    const parsedFileDestinationPath = filePath.replace(
      IMPORT_FOLDERS.Uploaded,
      IMPORT_FOLDERS.Parsed
    );
    await moveS3Object(
      bucketName,
      filePath,
      bucketName,
      parsedFileDestinationPath
    );

    console.log(
      `File "${filePath}" parsed successfully and put in ${parsedFileDestinationPath}`
    );
  } catch (err: unknown) {
    const error = err as Error;

    console.error('Error occurred: ', error.message);

    throw error;
  }
};
