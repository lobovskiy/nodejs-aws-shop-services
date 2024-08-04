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
        image: 'https://ltm-music.ru/upload/images/pe-1500ri_sbr.jpg',
      }),
      createSqsRecordMock('messageIdMock2', {
        title: 'Schecter BlackJack SLS C-7 A Electric Guitar',
        description: '7-string electric guitar, active pickups',
        price: 77.8,
        count: 3,
        image:
          'https://ltm-music.ru/upload/images/blackjack_sls_c-7_active_crb_.jpg',
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
          image: product.image,
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

    expect(result).toBeUndefined();
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

    expect(result).toBeUndefined();

    expect(createAvailableProductMock).toHaveBeenCalledTimes(
      sqsEventMock.Records.length
    );
    expect(publishToSnsTopicMock).not.toHaveBeenCalled();
  });
});
