import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { TableV2, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SERVICE_API_PATH } from '../../src/consts';

export class ProductsBaseStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly getProductsList: NodejsFunction;
  public readonly getProductsById: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new TableV2(this, 'ProductTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'products',
    });
    const stocksTable = new TableV2(this, 'StocksTable', {
      partitionKey: { name: 'product_id', type: AttributeType.STRING },
      tableName: 'stocks',
    });

    const commonLambdaProps = {
      runtime: Runtime.NODEJS_20_X,
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    };

    this.getProductsList = new NodejsFunction(this, 'LambdaGetProductsList ', {
      ...commonLambdaProps,
      handler: 'handler',
      functionName: 'get-products-list',
      entry: 'src/handlers/getProductsList.ts',
    });
    this.getProductsById = new NodejsFunction(this, 'LambdaGetProductsById ', {
      ...commonLambdaProps,
      handler: 'handler',
      functionName: 'get-products-by-id',
      entry: 'src/handlers/getProductsById.ts',
    });

    productsTable.grantReadData(this.getProductsList);
    productsTable.grantReadData(this.getProductsById);

    stocksTable.grantReadData(this.getProductsList);
    stocksTable.grantReadData(this.getProductsById);

    this.api = new apigateway.RestApi(this, 'ProductsRestApi', {
      restApiName: 'products-rest-api',
      deploy: false,
    });

    const productsResource = this.api.root.addResource(SERVICE_API_PATH);
    productsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.getProductsList)
    );

    const productByIdResource = productsResource.addResource('{id}');
    productByIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.getProductsById)
    );
  }
}
