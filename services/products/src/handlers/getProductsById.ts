import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { queryTableItemByKey } from '../database/service';
import { responseHeaders } from './consts';
import { IStock, IProduct, IAvailableProduct } from '../types';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    `Handler "getProductsById" requested with event argument: ${JSON.stringify(event)}`
  );

  const id = event.pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Missing path parameter: id' }),
    };
  }

  try {
    const productItem = await queryTableItemByKey(
      'id',
      id,
      process.env.PRODUCTS_TABLE_NAME!
    );

    if (!productItem) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    const stockItem = await queryTableItemByKey(
      'product_id',
      id,
      process.env.STOCKS_TABLE_NAME!
    );

    const product = unmarshall(productItem) as IProduct;
    const stock = stockItem ? (unmarshall(stockItem) as IStock) : null;

    const availableProduct: IAvailableProduct = {
      ...product,
      count: stock?.count || 0,
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
};
