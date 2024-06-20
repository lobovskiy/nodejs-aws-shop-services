import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { responseHeaders } from './consts';
import { products } from '../__mocks__/products';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Missing path parameter: id' }),
    };
  }

  try {
    const product = products.find((p) => p.id === id);

    if (!product) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(product),
    };
  } catch (err: unknown) {
    const error = err as Error;

    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
