import * as dbService from '../src/database/service';
import { handler } from '../src/handlers/getProductsList';
import { responseHeaders } from '../src/handlers/consts';
import {
  createMockApiGatewayProxyEvent,
  isAvailableProduct,
  marshallArray,
  setTestEnv,
} from './utils';
import { DB_TABLE_NAMES } from '../src/consts';
import { IAvailableProduct } from '../src/types';
import { products as productsMock } from '../src/__mocks__/products';
import { stocks as stocksMock } from '../src/__mocks__/stocks';

const productsTableItemsMock = marshallArray(productsMock);
const stocksTableItemsMock = marshallArray(stocksMock);

describe('getProductsList handler', () => {
  const PREV_ENV = process.env;
  const scanTableMock = jest.spyOn(dbService, 'scanTable');

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...PREV_ENV };
    setTestEnv();

    scanTableMock.mockImplementation((tableName: string) => {
      if (tableName === DB_TABLE_NAMES.Products) {
        return Promise.resolve(productsTableItemsMock);
      }

      if (tableName === DB_TABLE_NAMES.Stocks) {
        return Promise.resolve(stocksTableItemsMock);
      }

      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    scanTableMock.mockClear();
  });

  afterAll(() => {
    process.env = PREV_ENV;
  });

  it('should return list of products with status code 200', async () => {
    const result = await handler(createMockApiGatewayProxyEvent());

    expect(scanTableMock).toHaveBeenCalledTimes(2);
    expect(result.statusCode).toEqual(200);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toEqual(productsMock.length);
    body.forEach((obj: unknown) => expect(isAvailableProduct(obj)).toBe(true));
  });

  it('should return list of products with each product count = 0 if there are no stocks gotten', async () => {
    scanTableMock.mockImplementation((tableName: string) => {
      if (tableName === DB_TABLE_NAMES.Products) {
        return Promise.resolve(productsTableItemsMock);
      }

      return Promise.resolve([]);
    });

    const result = await handler(createMockApiGatewayProxyEvent());

    expect(scanTableMock).toHaveBeenCalledTimes(2);
    expect(result.statusCode).toEqual(200);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toEqual(productsMock.length);
    body.forEach((product: IAvailableProduct) => expect(product.count).toBe(0));
  });

  it('should return error with status code 500 if service error occurs', async () => {
    const error = new Error('Test error');
    scanTableMock.mockImplementation(() => {
      throw error;
    });

    const result = await handler(createMockApiGatewayProxyEvent());

    expect(scanTableMock).toHaveBeenCalledTimes(1);
    expect(result.statusCode).toEqual(500);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual(error.message);
  });
});
