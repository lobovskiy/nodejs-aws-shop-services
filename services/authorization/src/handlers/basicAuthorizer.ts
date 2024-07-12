import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda';

import { generatePolicy } from './utils';

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log(
    `Handler "basicAuthorizer" requested with event argument: ${JSON.stringify(event)}`
  );

  const { authorizationToken } = event;
  const { methodArn } = event;

  if (!authorizationToken) {
    return generatePolicy('user', 'Deny', methodArn);
  }

  const [authType, token] = authorizationToken.split(' ');

  if (authType !== 'Basic' || !token) {
    return generatePolicy('user', 'Deny', methodArn);
  }

  try {
    const [username, password] = Buffer.from(token, 'base64')
      .toString('utf8')
      .split(':');
    const storedPassword = process.env[username];

    if (!storedPassword || storedPassword !== password) {
      return generatePolicy('user', 'Deny', methodArn);
    }

    return generatePolicy('user', 'Allow', methodArn);
  } catch (err: unknown) {
    const error = err as Error;

    console.error('Error occurred: ', error.message);

    return generatePolicy('user', 'Deny', methodArn);
  }
};
