import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SERVICE_API_PATH } from '../../src/consts';

export class ProductsBaseStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly getProductsList: NodejsFunction;
  public readonly getProductsById: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.getProductsList = new NodejsFunction(this, 'LambdaGetProductsList ', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      functionName: 'get-products-list',
      entry: 'src/handlers/getProductsList.ts',
    });
    this.getProductsById = new NodejsFunction(this, 'LambdaGetProductsById ', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      functionName: 'get-products-by-id',
      entry: 'src/handlers/getProductsById.ts',
    });

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
