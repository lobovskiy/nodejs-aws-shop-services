import { handler } from '../src/handlers/importProductsFile';
import * as utils from '../src/handlers/utils';
import { createApiGatewayProxyEventMock } from './utils';

describe('importProductsFile handler', () => {
  const URL_MOCK = 'https://url-mock';
  const getS3UploadSignedUrlMock = jest.spyOn(utils, 'getS3UploadSignedUrl');

  beforeEach(() => {
    getS3UploadSignedUrlMock.mockResolvedValue(URL_MOCK);
  });

  afterEach(() => {
    getS3UploadSignedUrlMock.mockClear();
  });

  it('should return signed url with status code 200', async () => {
    const result = await handler(
      createApiGatewayProxyEventMock({ name: 'file.csv' })
    );

    expect(result.statusCode).toEqual(200);
    expect(result.body).toContain(URL_MOCK);
    expect(getS3UploadSignedUrlMock).toHaveBeenCalledTimes(1);
  });

  it('should return 404 status code with error message when file name is not provided', async () => {
    const result = await handler(createApiGatewayProxyEventMock());

    expect(result.statusCode).toEqual(400);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Invalid query parameter: name');
    expect(getS3UploadSignedUrlMock).toHaveBeenCalledTimes(0);
  });

  it('should return 404 status code with error message when file does not have the csv extension', async () => {
    const result = await handler(
      createApiGatewayProxyEventMock({ name: 'file.txt' })
    );

    expect(result.statusCode).toEqual(400);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual(
      'Invalid file extension. Importing file should be .csv'
    );
    expect(getS3UploadSignedUrlMock).toHaveBeenCalledTimes(0);
  });

  it('should return 500 status code with error message on internal server error', async () => {
    const error = new Error('Test error');
    getS3UploadSignedUrlMock.mockRejectedValue(error);

    const result = await handler(
      createApiGatewayProxyEventMock({ name: 'file.csv' })
    );

    expect(result.statusCode).toEqual(500);

    const body = JSON.parse(result.body);
    expect(body.message).toEqual('Internal server error');
    expect(getS3UploadSignedUrlMock).toHaveBeenCalledTimes(1);
  });
});
