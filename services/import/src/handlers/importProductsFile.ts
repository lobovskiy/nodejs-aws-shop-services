import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { importUrlSchema } from '../schemas';
import { IMPORT_FOLDERS } from '../consts';
import { getS3UploadSignedUrl } from './utils';
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
      const url = await getS3UploadSignedUrl(bucketName, objectKey);

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
