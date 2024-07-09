import * as utils from '../src/handlers/utils';
import { handler } from '../src/handlers/createProduct';
import { responseHeaders } from '../src/handlers/consts';
import {
  createMockApiGatewayProxyEvent,
  isAvailableProduct,
  setTestEnv,
} from './utils';
import { IAvailableProduct, IProduct, IStock } from '../src/types';

describe('createProduct handler', () => {
  const PREV_ENV = process.env;
  const createAvailableProductMock = jest.spyOn(
    utils,
    'createAvailableProduct'
  );

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...PREV_ENV };
    setTestEnv();

    createAvailableProductMock.mockImplementation(
      (product: IProduct, stock: IStock) =>
        Promise.resolve({
          id: 'idMock',
          title: product.title,
          description: product.description,
          price: product.price,
          count: stock.count,
        })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = PREV_ENV;
  });

  it('should return created available product with status code 201 when product data received is correct', async () => {
    const productDataMock: Omit<IAvailableProduct, 'id'> = {
      title: 'Test product',
      description: 'Test description',
      price: 23,
      count: 1,
    };

    const result = await handler(
      createMockApiGatewayProxyEvent(null, JSON.stringify(productDataMock))
    );

    expect(createAvailableProductMock).toHaveBeenCalledTimes(1);
    expect(result.statusCode).toEqual(201);
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

    expect(createAvailableProductMock).toHaveBeenCalledTimes(0);
    expect(result.statusCode).toEqual(400);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Product data is wrong');
  });

  it('should return 400 status code if there is no product data received', async () => {
    const result = await handler(createMockApiGatewayProxyEvent());

    expect(createAvailableProductMock).toHaveBeenCalledTimes(0);
    expect(result.statusCode).toEqual(400);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Product data is wrong');
  });

  it('should return 500 status code with error message on internal server error', async () => {
    const error = new Error('Test error');
    createAvailableProductMock.mockImplementation(() => {
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

    expect(createAvailableProductMock).toHaveBeenCalledTimes(1);
    expect(result.statusCode).toEqual(500);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual(error.message);
  });
});
