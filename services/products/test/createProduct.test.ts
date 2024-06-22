import * as dbService from '../src/database/service';
import { handler } from '../src/handlers/createProduct';
import { responseHeaders } from '../src/handlers/consts';
import {
  createMockApiGatewayProxyEvent,
  isAvailableProduct,
  setTestEnv,
} from './utils';
import { IAvailableProduct } from '../src/types';

describe('getProductsById handler', () => {
  const PREV_ENV = process.env;
  const transactWriteItemsMock = jest.spyOn(dbService, 'transactWriteItems');

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...PREV_ENV };
    setTestEnv();

    transactWriteItemsMock.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    transactWriteItemsMock.mockClear();
  });

  afterAll(() => {
    process.env = PREV_ENV;
  });

  it('should return created available product with status code 200 when product data received is correct', async () => {
    const productDataMock: Omit<IAvailableProduct, 'id'> = {
      title: 'Test product',
      description: 'Test description',
      price: 23,
      count: 1,
    };

    const result = await handler(
      createMockApiGatewayProxyEvent(null, JSON.stringify(productDataMock))
    );

    expect(transactWriteItemsMock).toHaveBeenCalledTimes(1);
    expect(result.statusCode).toEqual(200);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(isAvailableProduct(body)).toEqual(true);
    const { title, description, price, count } = body;
    expect({ title, description, price, count }).toEqual(productDataMock);
  });

  it('should return 400 status code if product data received is invalid', async () => {
    const productDataMock = {
      title: 'Test product',
      description: 'Test description',
      price: 'invalid price',
      count: 1,
    };

    const result = await handler(
      createMockApiGatewayProxyEvent(null, JSON.stringify(productDataMock))
    );

    expect(transactWriteItemsMock).toHaveBeenCalledTimes(0);
    expect(result.statusCode).toEqual(400);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Product data is wrong');
  });

  it('should return 400 status code if there is no product data received', async () => {
    const result = await handler(createMockApiGatewayProxyEvent());

    expect(transactWriteItemsMock).toHaveBeenCalledTimes(0);
    expect(result.statusCode).toEqual(400);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Product data is wrong');
  });

  it('should return 500 status code with error message on internal server error', async () => {
    const error = new Error('Test error');
    transactWriteItemsMock.mockImplementation(() => {
      throw error;
    });

    const productDataMock: Omit<IAvailableProduct, 'id'> = {
      title: 'Test product',
      description: 'Test description',
      price: 23,
      count: 1,
    };

    const result = await handler(
      createMockApiGatewayProxyEvent(null, JSON.stringify(productDataMock))
    );

    expect(transactWriteItemsMock).toHaveBeenCalledTimes(1);
    expect(result.statusCode).toEqual(500);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual(error.message);
  });
});
