import {
  APIGatewayEventRequestContextWithAuthorizer,
  APIGatewayProxyEvent,
  APIGatewayProxyEventQueryStringParameters,
} from 'aws-lambda';

export function createApiGatewayProxyEventMock(
  queryStringParameters: APIGatewayProxyEventQueryStringParameters | null = null
): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/import',
    pathParameters: {},
    queryStringParameters,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayEventRequestContextWithAuthorizer<object>,
    resource: '',
  };
}
