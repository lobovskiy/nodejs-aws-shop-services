import { handler } from '../src/handlers/importFileParser';
import { S3Event } from 'aws-lambda';
import { Readable } from 'stream';

import * as utils from '../src/handlers/utils';

const s3EventMock: S3Event = {
  Records: [
    {
      eventVersion: '2.1',
      eventSource: 'aws:s3',
      awsRegion: 'eu-central-1',
      eventTime: new Date().toISOString(),
      eventName: 'ObjectCreated:Put',
      userIdentity: {
        principalId: 'AWS:principalIdMock:import-products-file',
      },
      requestParameters: {
        sourceIPAddress: '127.0.0.1',
      },
      responseElements: {
        'x-amz-request-id': 'x-amz-request-id-mock',
        'x-amz-id-2': 'x-amz-id-2-mock',
      },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'configurationIdMock',
        bucket: {
          name: 'lobovskiy-nodejs-aws-shop-import-service',
          ownerIdentity: {
            principalId: 'principalIdMock',
          },
          arn: 'arn:aws:s3:::arn-mock',
        },
        object: {
          key: 'uploaded/products.csv',
          size: 1754,
          eTag: 'eTagMock',
          sequencer: 'sequencerMock',
        },
      },
    },
  ],
};
const streamMock = new Readable();

describe('importFileParser handler', () => {
  const getS3ObjectStreamingBlobPayloadMock = jest.spyOn(
    utils,
    'getS3ObjectStreamingBlobPayload'
  );
  const parseCsvFileMock = jest.spyOn(utils, 'parseCsvFile');
  const moveS3ObjectMock = jest.spyOn(utils, 'moveS3Object');

  beforeEach(() => {
    getS3ObjectStreamingBlobPayloadMock.mockResolvedValue(streamMock);
    parseCsvFileMock.mockResolvedValue();
    moveS3ObjectMock.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully get file stream and call file parser', async () => {
    await handler(s3EventMock);

    expect(getS3ObjectStreamingBlobPayloadMock).toHaveBeenCalledTimes(1);
    expect(parseCsvFileMock).toHaveBeenCalledTimes(1);
  });

  it('should handle an error occurred while reading file stream', async () => {
    const streamReadingError = new Error('Stream reading error');
    getS3ObjectStreamingBlobPayloadMock.mockRejectedValue(streamReadingError);

    try {
      await handler(s3EventMock);
    } catch (err: unknown) {
      const error = err as Error;

      expect(error.message).toBe(streamReadingError.message);
    }

    expect(getS3ObjectStreamingBlobPayloadMock).toHaveBeenCalledTimes(1);
    expect(parseCsvFileMock).not.toHaveBeenCalled();
  });

  it('should handle an error occurred while parsing a file', async () => {
    const fileParsingError = new Error('File parsing error');
    parseCsvFileMock.mockRejectedValue(fileParsingError);

    try {
      await handler(s3EventMock);
    } catch (err: unknown) {
      const error = err as Error;

      expect(error.message).toBe(fileParsingError.message);
    }

    expect(getS3ObjectStreamingBlobPayloadMock).toHaveBeenCalledTimes(1);
    expect(parseCsvFileMock).toHaveBeenCalledTimes(1);
  });

  it('should handle an empty s3 event', async () => {
    const emptyS3EventMock = { Records: [] };

    await expect(handler(emptyS3EventMock)).resolves.toBeUndefined();

    expect(getS3ObjectStreamingBlobPayloadMock).not.toHaveBeenCalled();
    expect(parseCsvFileMock).not.toHaveBeenCalled();
  });
});
