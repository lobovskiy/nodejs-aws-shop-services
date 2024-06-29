import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { responseHeaders } from './consts';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    `Handler "importProductsFile" requested with event argument: ${JSON.stringify(event)}`
  );

  return {
    statusCode: 200,
    headers: responseHeaders,
    body: 'Hello from Lambda',
  };
};
