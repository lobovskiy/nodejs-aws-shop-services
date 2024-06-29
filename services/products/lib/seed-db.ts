import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { products } from '../__mocks__/products';
import { stocks } from '../__mocks__/stocks';
import { DB_TABLE_NAMES } from '../src/consts';

const dbClient = new DynamoDBClient({
  region: process.env.CDK_DEFAULT_REGION,
});

const createBatch = (items: object[]) => {
  return items.map((item) => ({
    PutRequest: {
      Item: marshall(item),
    },
  }));
};

const seedTable = async (tableName: string, items: object[]): Promise<void> => {
  const command = new BatchWriteItemCommand({
    RequestItems: {
      [tableName]: createBatch(items),
    },
  });

  try {
    await dbClient.send(command);
    console.log(`Table "${tableName}" seeded successfully`);
  } catch (error) {
    console.error(`Error occurred while seeding table "${tableName}"`, error);
  }
};

const seedDb = async () => {
  await seedTable(DB_TABLE_NAMES.Products, products);
  await seedTable(DB_TABLE_NAMES.Stocks, stocks);
};

seedDb();
