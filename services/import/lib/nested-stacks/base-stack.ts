import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { IMPORT_API, IMPORT_FOLDERS } from '../../src/consts';

export class ImportBaseStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly importProductsFile: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaBasicAuthorizer = lambda.Function.fromFunctionAttributes(
      this,
      'LambdaBasicAuthorizer',
      {
        functionArn: process.env.LAMBDA_BASIC_AUTHORIZER_ARN!,
        sameEnvironment: true,
      }
    );

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      'ImportServiceBasicAuthorizer',
      {
        handler: lambdaBasicAuthorizer,
        resultsCacheTtl: cdk.Duration.seconds(0),
      }
    );

    const createProductQueue = sqs.Queue.fromQueueArn(
      this,
      'CreateProductQueue',
      process.env.CREATE_PRODUCT_QUEUE_ARN!
    );

    const bucket = new s3.Bucket(this, 'NodejsAwsShopImportService', {
      bucketName: 'lobovskiy-nodejs-aws-shop-import-service',
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.POST,
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        IMPORT_BUCKET_NAME: bucket.bucketName,
        PRODUCTS_QUEUE_URL: createProductQueue.queueUrl,
      },
    };

    this.importProductsFile = new NodejsFunction(
      this,
      'LambdaImportProductsFile',
      {
        ...commonLambdaProps,
        handler: 'handler',
        functionName: 'import-products-file',
        entry: 'src/handlers/importProductsFile.ts',
      }
    );

    const importFileParser = new NodejsFunction(
      this,
      'LambdaImportFileParser',
      {
        ...commonLambdaProps,
        handler: 'handler',
        functionName: 'import-file-parser',
        entry: 'src/handlers/importFileParser.ts',
      }
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(importFileParser),
      { prefix: IMPORT_FOLDERS.Uploaded }
    );

    bucket.grantReadWrite(this.importProductsFile);
    bucket.grantReadWrite(importFileParser);
    bucket.grantDelete(importFileParser);

    createProductQueue.grantSendMessages(importFileParser);

    new lambda.CfnPermission(this, 'BasicAuthorizerPermission', {
      action: 'lambda:InvokeFunction',
      functionName: lambdaBasicAuthorizer.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceAccount: this.account,
    });

    this.api = new apigateway.RestApi(this, 'ImportRestApi', {
      restApiName: 'import-rest-api',
      deploy: false,
    });

    const importResource = this.api.root.addResource(IMPORT_API, {
      defaultCorsPreflightOptions: {
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });
    importResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.importProductsFile),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      }
    );

    this.api.addGatewayResponse('Default4xxResponse', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
    });
  }
}
