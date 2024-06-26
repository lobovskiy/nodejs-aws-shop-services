import {
  AttributeValue,
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: process.env.CDK_DEFAULT_REGION,
});

export const scanTable = async (tableName: string) => {
  const command = new ScanCommand({
    TableName: tableName,
  });

  const { Items } = await client.send(command);

  return Items;
};

export const queryTableItemByKey = async (
  keyName: string,
  keyValue: string,
  tableName: string
) => {
  const command = new QueryCommand({
    KeyConditionExpression: `${keyName} = :keyName`,
    ExpressionAttributeValues: {
      ':keyName': { S: keyValue },
    },
    TableName: tableName,
  });

  const { Items } = await client.send(command);

  return Items?.length ? Items[0] : null;
};

export const transactWriteItems = async (
  writingData: [item: Record<string, AttributeValue>, tableName: string][]
) => {
  const command = new TransactWriteItemsCommand({
    TransactItems: writingData.map(([item, tableName]) => ({
      Put: {
        TableName: tableName,
        Item: item,
      },
    })),
  });

  await client.send(command);
};
