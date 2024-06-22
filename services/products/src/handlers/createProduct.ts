import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { marshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'node:crypto';

import { transactWriteItems } from '../database/service';
import { isJsonString } from '../utils';
import { responseHeaders } from './consts';
import { productSchema } from '../schemas';
import { IAvailableProduct } from '../types';

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

    const productItem = marshall(product);
    const stockItem = marshall({
      product_id: productId,
      count,
    });

    try {
      await transactWriteItems([
        [productItem, process.env.PRODUCTS_TABLE_NAME!],
        [stockItem, process.env.STOCKS_TABLE_NAME!],
      ]);

      const availableProduct: IAvailableProduct = {
        ...product,
        count,
      };

      return {
        statusCode: 200,
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
