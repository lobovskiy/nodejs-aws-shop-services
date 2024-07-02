import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { IMPORT_API, IMPORT_FOLDERS } from '../../src/consts';

export class ImportBaseStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly importProductsFile: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    this.api = new apigateway.RestApi(this, 'ImportRestApi', {
      restApiName: 'import-rest-api',
      deploy: false,
    });

    const importResource = this.api.root.addResource(IMPORT_API);
    importResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.importProductsFile)
    );
  }
}