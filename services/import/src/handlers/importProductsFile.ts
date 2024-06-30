import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { importUrlSchema } from '../schemas';
import { IMPORT_FOLDERS, URL_EXPIRATION_TIME_IN_SECONDS } from '../consts';
import { s3Client } from './utils';
import { responseHeaders } from './consts';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    `Handler "importProductsFile" requested with event argument: ${JSON.stringify(event)}`
  );

  try {
    const { name: fileName } = await importUrlSchema.validate(
      event.queryStringParameters,
      {
        strict: true,
      }
    );

    if (!fileName.toLowerCase().endsWith('.csv')) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({
          message: 'Invalid file extension. Importing file should be .csv',
        }),
      };
    }

    try {
      const bucketName = process.env.IMPORT_BUCKET_NAME!;
      const objectKey = `${IMPORT_FOLDERS.Uploaded}/${fileName}`;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ContentType: 'text/csv',
      });
      const url = await getSignedUrl(s3Client, command, {
        expiresIn: URL_EXPIRATION_TIME_IN_SECONDS,
      });

      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify(url),
      };
    } catch (err: unknown) {
      const error = err as Error;

      console.error('Error occurred: ', error.message);

      return {
        statusCode: 500,
        headers: responseHeaders,
        body: JSON.stringify({ message: 'Internal server error' }),
      };
    }
  } catch (err) {
    const error = err as Error;
    console.error('Validation error: ', error.message);

    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Invalid query parameter: name' }),
    };
  }
};
