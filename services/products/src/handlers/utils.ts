import {
  SNSClient,
  PublishCommand,
  MessageAttributeValue,
} from '@aws-sdk/client-sns';
import { marshall } from '@aws-sdk/util-dynamodb';

import { transactWriteItems } from '../database/service';
import { IAvailableProduct, IProduct, IStock } from '../types';

const client = new SNSClient({
  region: process.env.CDK_DEFAULT_REGION,
});

export async function createAvailableProduct(product: IProduct, stock: IStock) {
  const productItem = marshall(product);
  const stockItem = marshall(stock);

  await transactWriteItems([
    [productItem, process.env.PRODUCTS_TABLE_NAME!],
    [stockItem, process.env.STOCKS_TABLE_NAME!],
  ]);

  const availableProduct: IAvailableProduct = {
    ...product,
    count: stock.count,
  };

  return availableProduct;
}

export async function publishToSnsTopic(
  TopicArn: string,
  Subject: string,
  Message: string,
  MessageAttributes: Record<string, MessageAttributeValue>
) {
  const command = new PublishCommand({
    TopicArn,
    Message,
    Subject,
    MessageAttributes,
  });
  const result = await client.send(command);

  return result;
}
