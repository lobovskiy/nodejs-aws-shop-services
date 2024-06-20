import { handler } from '../src/handlers/getProductsById';
import { responseHeaders } from '../src/handlers/consts';
import { products } from '../src/__mocks__/products';
import {
  APIGatewayEventRequestContextWithAuthorizer,
  APIGatewayProxyEvent,
} from 'aws-lambda';

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

describe('getProductsById handler', () => {
  it('should return product with status code 200 when id is provided', async () => {
    const result = await handler(createMockApiGatewayProxyEvent('1'));

    expect(result.statusCode).toEqual(200);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body).toEqual(products.find((product) => product.id === '1'));
  });

  it('should return 400 status code with error message when id is missing', async () => {
    const result = await handler(createMockApiGatewayProxyEvent());

    expect(result.statusCode).toEqual(400);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Missing path parameter: id');
  });

  it('should return 404 status code with error message when product is not found', async () => {
    const result = await handler(createMockApiGatewayProxyEvent('999'));

    expect(result.statusCode).toEqual(404);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Product not found');
  });

  it('should return 500 status code with error message on internal server error', async () => {
    const error = new Error('Test error');
    jest.spyOn(products, 'find').mockImplementationOnce(() => {
      throw error;
    });

    const result = await handler(createMockApiGatewayProxyEvent('1'));

    expect(result.statusCode).toEqual(500);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual(error.message);
  });
});
