import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ImportBaseStack } from './nested-stacks/base-stack';
import { ImportDevStageStack } from './nested-stacks/dev-stage-stack';
import { ImportProdStageStack } from './nested-stacks/prod-stage-stack';

export class ImportStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const baseStack = new ImportBaseStack(this, 'ImportServiceBaseStack');

    new ImportDevStageStack(this, 'ImportServiceDevStageStack', {
      api: baseStack.api,
    });
    new ImportProdStageStack(this, 'ImportServiceProdStageStack', {
      api: baseStack.api,
    });
  }
}
