import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dotenv from 'dotenv';

const environment = {};
dotenv.config({ processEnv: environment });

export class AuthorizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new NodejsFunction(this, 'LambdaBasicAuthorizer', {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: 'basic-authorizer',
      entry: 'src/handlers/basicAuthorizer.ts',
      environment,
    });
  }
}
