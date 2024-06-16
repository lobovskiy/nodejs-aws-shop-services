import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  HttpApi,
  CorsHttpMethod,
  HttpMethod,
} from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { SERVICE_API_PATH } from '../src/consts';

export class ProductStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new NodejsFunction(this, 'LambdaGetProductsList ', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      functionName: 'get-products-list',
      entry: 'src/handlers/getProductsList.ts',
    });
    const getProductsById = new NodejsFunction(this, 'LambdaGetProductsById ', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      functionName: 'get-products-by-id',
      entry: 'src/handlers/getProductsById.ts',
    });

    const httpApi = new HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: ['*'],
      },
    });

    const getProductsListIntegration = new HttpLambdaIntegration(
      'LambdaGetProductsListIntegration',
      getProductsList
    );
    const getProductsByIdIntegration = new HttpLambdaIntegration(
      'LambdaGetProductsByIdIntegration',
      getProductsById
    );

    httpApi.addRoutes({
      path: `/${SERVICE_API_PATH}`,
      methods: [HttpMethod.GET],
      integration: getProductsListIntegration,
    });
    httpApi.addRoutes({
      path: `/${SERVICE_API_PATH}/{id}`,
      methods: [HttpMethod.GET],
      integration: getProductsByIdIntegration,
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint,
    });
  }
}
