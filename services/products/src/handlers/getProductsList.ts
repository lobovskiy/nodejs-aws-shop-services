import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { scanTable } from '../database/service';
import { responseHeaders } from './consts';
import { IAvailableProduct, IProduct, IStock } from '../types';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    `Handler "getProductsList" requested with event argument: ${JSON.stringify(event)}`
  );

  try {
    const productsTableItems = await scanTable(
      process.env.PRODUCTS_TABLE_NAME || ''
    );
    const stocksTableItems = await scanTable(
      process.env.STOCKS_TABLE_NAME || ''
    );

    const products = (productsTableItems ?? []).map(
      (product) => unmarshall(product) as IProduct
    );
    const stocks = (stocksTableItems ?? []).map(
      (stock) => unmarshall(stock) as IStock
    );

    const availableProducts: IAvailableProduct[] = products.map((product) => {
      const stock = stocks.find((stock) => stock.product_id === product.id);
      const count = stock?.count || 0;

      return {
        ...product,
        count,
      };
    });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(availableProducts),
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
