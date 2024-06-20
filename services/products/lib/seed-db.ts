import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { products } from '../src/__mocks__/products';
import { stocks } from '../src/__mocks__/stocks';
import { TABLE_NAMES } from '../src/consts';

const dbClient = new DynamoDBClient({
  region: process.env.CDK_DEFAULT_REGION,
});

const generateBatch = <T extends object>(items: T[]) => {
  return items.map((item) => ({
    PutRequest: {
      Item: marshall(item),
    },
  }));
};

const seedTable = async <T extends object>(
  tableName: string,
  items: T[]
): Promise<void> => {
  const command = new BatchWriteItemCommand({
    RequestItems: {
      [tableName]: generateBatch(items),
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
  await seedTable(TABLE_NAMES.Products, products);
  await seedTable(TABLE_NAMES.Stocks, stocks);
};

seedDb();
