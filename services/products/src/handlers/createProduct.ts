import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'node:crypto';

import { isJsonString } from '../utils';
import { responseHeaders } from './consts';
import { productSchema } from '../schemas';
import { createAvailableProduct } from './utils';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    `Handler "createProduct" requested with event argument: ${JSON.stringify(event)}`
  );

  const { body: bodyStringified } = event;

  if (!bodyStringified || !isJsonString(bodyStringified)) {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Product data is wrong' }),
    };
  }

  try {
    const body = JSON.parse(bodyStringified);
    const { title, description, price, count } = await productSchema.validate(
      body,
      { strict: true }
    );
    const productId = randomUUID();

    const product = { id: productId, title, description, price };
    const stock = { product_id: productId, count };

    try {
      const availableProduct = await createAvailableProduct(product, stock);

      return {
        statusCode: 201,
        headers: responseHeaders,
        body: JSON.stringify(availableProduct),
      };
    } catch (err: unknown) {
      const error = err as Error;

      return {
        statusCode: 500,
        headers: responseHeaders,
        body: JSON.stringify({ message: error.message }),
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Product data is wrong' }),
    };
  }
};
