import { randomUUID } from 'node:crypto';
import { SQSEvent } from 'aws-lambda/trigger/sqs';

import { isJsonString } from '../utils';
import { productSchema } from '../schemas';
import { IProduct, IStock } from '../types';
import { createAvailableProduct, publishToSnsTopic } from './utils';

const { PRODUCT_TOPIC_ARN } = process.env;

export const handler = async (event: SQSEvent) => {
  console.log(
    `Handler "catalogBatchProcess" requested with event argument: ${JSON.stringify(event)}`
  );

  const { Records } = event;

  for (const record of Records) {
    const { body: bodyStringified } = record;

    if (!bodyStringified || !isJsonString(bodyStringified)) {
      console.log(
        'Error occured in catalog batch process: invalid record body'
      );

      return;
    }

    try {
      const recordBody = JSON.parse(bodyStringified);
      const { title, description, price, count } = await productSchema.validate(
        recordBody,
        { abortEarly: false }
      );
      const productId = randomUUID();

      const product: IProduct = {
        id: productId,
        title,
        description,
        price,
      };
      const stock: IStock = {
        product_id: productId,
        count,
      };

      try {
        const availableProduct = await createAvailableProduct(product, stock);

        const snsResult = await publishToSnsTopic(
          PRODUCT_TOPIC_ARN!,
          'Product added to AWS Shop catalog',
          JSON.stringify(availableProduct),
          {
            count: {
              DataType: 'Number',
              StringValue: availableProduct.count.toString(),
            },
          }
        );

        console.log('snsResult', snsResult);
      } catch (err: unknown) {
        const error = err as Error;

        console.log('Error occured in catalog batch process: ', error.message);
      }
    } catch (err) {
      const error = err as Error;

      console.log(
        'Record validation error in catalog batch process: ',
        error.message
      );
    }
  }
};
