import {
  APIGatewayEventRequestContextWithAuthorizer,
  APIGatewayProxyEvent,
} from 'aws-lambda';
import { marshall } from '@aws-sdk/util-dynamodb';

import * as dbService from '../src/database/service';
import { handler } from '../src/handlers/getProductsById';
import { responseHeaders } from '../src/handlers/consts';
import { setTestEnv } from './utils';
import { DB_TABLE_NAMES } from '../src/consts';
import { products as productsMock } from '../src/__mocks__/products';
import { stocks as stocksMock } from '../src/__mocks__/stocks';
import { IProduct, IStock } from '../src/types';

const createMockApiGatewayProxyEvent = (id?: string): APIGatewayProxyEvent => ({
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'GET',
  isBase64Encoded: false,
  path: `/products/${id}`,
  pathParameters: { id },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as APIGatewayEventRequestContextWithAuthorizer<object>,
  resource: '',
});

const getAvailableProductMock = (productMock: IProduct) => {
  const stockMock = stocksMock.find(
    (stock) => stock.product_id === productMock.id
  );
  const count = stockMock?.count || 0;

  return { ...productMock, count };
};

describe('getProductsById handler', () => {
  const PREV_ENV = process.env;
  const queryTableItemByKeyMock = jest.spyOn(dbService, 'queryTableItemByKey');

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...PREV_ENV };
    setTestEnv();

    queryTableItemByKeyMock.mockImplementation(
      (keyName: string, keyValue: string, tableName: string) => {
        let result = null;

        if (tableName === DB_TABLE_NAMES.Products) {
          result = productsMock.find(
            (product) => product[keyName as keyof IProduct] === keyValue
          );
        }

        if (tableName === DB_TABLE_NAMES.Stocks) {
          result = stocksMock.find(
            (stock) => stock[keyName as keyof IStock] === keyValue
          );
        }

        return result
          ? Promise.resolve(marshall(result))
          : Promise.resolve(null);
      }
    );
  });

  afterEach(() => {
    queryTableItemByKeyMock.mockClear();
  });

  afterAll(() => {
    process.env = PREV_ENV;
  });

  it('should return product with status code 200 when id is provided', async () => {
    const productMock = productsMock[0];

    const result = await handler(
      createMockApiGatewayProxyEvent(productMock.id)
    );

    expect(queryTableItemByKeyMock).toHaveBeenCalledTimes(2);
    expect(result.statusCode).toEqual(200);
    expect(result.headers).toEqual(responseHeaders);

    const availableProductMock = getAvailableProductMock(productMock);
    const body = JSON.parse(result.body);
    expect(body).toEqual(availableProductMock);
  });

  it('should return 400 status code with error message when id is missing', async () => {
    const result = await handler(createMockApiGatewayProxyEvent());

    expect(queryTableItemByKeyMock).toHaveBeenCalledTimes(0);
    expect(result.statusCode).toEqual(400);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Missing path parameter: id');
  });

  it('should return 404 status code with error message when product is not found', async () => {
    const result = await handler(createMockApiGatewayProxyEvent('999'));

    expect(queryTableItemByKeyMock).toHaveBeenCalledTimes(1);
    expect(result.statusCode).toEqual(404);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Product not found');
  });

  it('should return 500 status code with error message on internal server error', async () => {
    const error = new Error('Test error');
    queryTableItemByKeyMock.mockImplementation(() => {
      throw error;
    });

    const result = await handler(createMockApiGatewayProxyEvent('1'));

    expect(queryTableItemByKeyMock).toHaveBeenCalledTimes(1);
    expect(result.statusCode).toEqual(500);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual(error.message);
  });
});
