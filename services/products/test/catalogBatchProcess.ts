import { SQSEvent } from 'aws-lambda';

import * as utils from '../src/handlers/utils';
import { handler } from '../src/handlers/catalogBatchProcess';
import { createSqsRecordMock } from './utils';
import { IProduct, IStock } from '../src/types';

describe('catalogBatchProcess handler', () => {
  const createAvailableProductMock = jest.spyOn(
    utils,
    'createAvailableProduct'
  );
  const publishToSnsTopicMock = jest.spyOn(utils, 'publishToSnsTopic');

  const sqsEventMock: SQSEvent = {
    Records: [
      createSqsRecordMock('messageIdMock1', {
        title: 'Aria PE-1500RI Electric guitar',
        description:
          'Electric guitar from the prestigious PE series, the flagship of Aria guitars',
        price: 23.3,
        count: 2,
      }),
      createSqsRecordMock('messageIdMock2', {
        title: 'Schecter BlackJack SLS C-7 A Electric Guitar',
        description: '7-string electric guitar, active pickups',
        price: 77.8,
        count: 3,
      }),
    ],
  };

  beforeEach(() => {
    createAvailableProductMock.mockImplementation(
      (product: IProduct, stock: IStock) =>
        Promise.resolve({
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          count: stock.count,
        })
    );
    publishToSnsTopicMock.mockResolvedValue({
      $metadata: {},
      MessageId: 'mockedMessageId',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle an SQS event, create available product and publish result to SNS', async () => {
    const result = await handler(sqsEventMock);

    expect(result).resolves.toBeUndefined();
    expect(createAvailableProductMock).toHaveBeenCalledTimes(
      sqsEventMock.Records.length
    );
    expect(publishToSnsTopicMock).toHaveBeenCalledTimes(
      sqsEventMock.Records.length
    );
  });

  it('should handle internal server error', async () => {
    const error = new Error('Test error');
    createAvailableProductMock.mockImplementation(() => {
      throw error;
    });

    const result = await handler(sqsEventMock);

    expect(result).rejects;

    expect(createAvailableProductMock).toHaveBeenCalledTimes(1);
    expect(publishToSnsTopicMock).not.toHaveBeenCalled();
  });
});
