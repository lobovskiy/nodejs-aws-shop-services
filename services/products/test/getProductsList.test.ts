import { handler } from '../src/handlers/getProductsList';
import { responseHeaders } from '../src/handlers/consts';
import { products } from '../src/__mocks__/products';

const isProduct = (obj: unknown) => {
  return (
    Object.prototype.hasOwnProperty.call(obj, 'id') &&
    Object.prototype.hasOwnProperty.call(obj, 'title') &&
    Object.prototype.hasOwnProperty.call(obj, 'description') &&
    Object.prototype.hasOwnProperty.call(obj, 'price')
  );
};

describe('getProductsList handler', () => {
  it('should return list of products with status code 200', async () => {
    const result = await handler();

    expect(result.statusCode).toEqual(200);
    expect(result.headers).toEqual(responseHeaders);

    const body = JSON.parse(result.body);
    expect(body).toEqual(products);
    expect(Array.isArray(body)).toBe(true);

    if (body.length > 0) {
      body.forEach((obj: unknown) => expect(isProduct(obj)).toBe(true));
    }
  });
});
