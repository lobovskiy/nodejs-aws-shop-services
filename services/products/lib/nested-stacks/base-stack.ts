import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { TableV2, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { DB_TABLE_NAMES, SERVICE_API_PATH } from '../../src/consts';

export class ProductsBaseStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly getProductsList: NodejsFunction;
  public readonly getProductsById: NodejsFunction;
  public readonly createProduct: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new TableV2(this, 'ProductTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: DB_TABLE_NAMES.Products,
    });
    const stocksTable = new TableV2(this, 'StocksTable', {
      partitionKey: { name: 'product_id', type: AttributeType.STRING },
      tableName: DB_TABLE_NAMES.Stocks,
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
    this.createProduct = new NodejsFunction(this, 'LambdaCreateProduct', {
      ...commonLambdaProps,
      handler: 'handler',
      functionName: 'create-product',
      entry: 'src/handlers/createProduct.ts',
    });

    productsTable.grantReadData(this.getProductsList);
    productsTable.grantReadData(this.getProductsById);
    productsTable.grantWriteData(this.createProduct);

    stocksTable.grantReadData(this.getProductsList);
    stocksTable.grantReadData(this.getProductsById);
    stocksTable.grantWriteData(this.createProduct);

    this.api = new apigateway.RestApi(this, 'ProductsRestApi', {
      restApiName: 'products-rest-api',
      deploy: false,
    });

    const productsResource = this.api.root.addResource(SERVICE_API_PATH, {
      defaultCorsPreflightOptions: {
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });
    productsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.getProductsList)
    );
    productsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.createProduct)
    );

    const productByIdResource = productsResource.addResource('{id}');
    productByIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.getProductsById)
    );
  }
}
