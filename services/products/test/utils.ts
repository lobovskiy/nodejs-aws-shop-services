import {
  APIGatewayEventRequestContextWithAuthorizer,
  APIGatewayProxyEvent,
  SQSRecord,
  SQSRecordAttributes,
} from 'aws-lambda';
import { marshall } from '@aws-sdk/util-dynamodb';

import { IAvailableProduct } from '../src/types';
import { DB_TABLE_NAMES } from '../src/consts';

export function setTestEnv() {
  process.env.PRODUCTS_TABLE_NAME = DB_TABLE_NAMES.Products;
  process.env.STOCKS_TABLE_NAME = DB_TABLE_NAMES.Stocks;
}

export function createMockApiGatewayProxyEvent(
  productId: string | null = null,
  body: string | null = null
): APIGatewayProxyEvent {
  const path = `/products${productId ? `/${productId}` : ''}`;

  return {
    body,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path,
    pathParameters: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayEventRequestContextWithAuthorizer<object>,
    resource: '',
  };
}

export function createSqsRecordMock(
  messageId: string,
  body: object
): SQSRecord {
  return {
    messageId,
    receiptHandle: `${messageId}ReceiptHandleMock`,
    body: JSON.stringify(body),
    attributes: {} as SQSRecordAttributes,
    messageAttributes: {},
    md5OfBody: 'md5OfBodyMock',
    eventSource: 'event-source-mock',
    eventSourceARN: 'event-source-arn-mock',
    awsRegion: 'region-mock',
  };
}

export function marshallArray(arr: object[]) {
  return arr.map((item) => marshall(item));
}

export function isAvailableProduct(obj: unknown): obj is IAvailableProduct {
  return (
    Object.prototype.hasOwnProperty.call(obj, 'id') &&
    Object.prototype.hasOwnProperty.call(obj, 'title') &&
    Object.prototype.hasOwnProperty.call(obj, 'description') &&
    Object.prototype.hasOwnProperty.call(obj, 'price') &&
    Object.prototype.hasOwnProperty.call(obj, 'image') &&
    Object.prototype.hasOwnProperty.call(obj, 'count')
  );
}
