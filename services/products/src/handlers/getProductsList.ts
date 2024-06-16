import { APIGatewayProxyResult } from 'aws-lambda';
import { responseHeaders } from './consts';
import { products } from '../data/products';

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(products),
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
