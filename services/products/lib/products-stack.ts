import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ProductsBaseStack } from './nested-stacks/base-stack';
import { ProductsDevStageStack } from './nested-stacks/dev-stage-stack';
import { ProductsProdStageStack } from './nested-stacks/prod-stage-stack';

export class ProductsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const baseStack = new ProductsBaseStack(this, 'BaseStack');

    new ProductsDevStageStack(this, 'DevStageStack', {
      api: baseStack.api,
    });
    new ProductsProdStageStack(this, 'ProdStageStack', {
      api: baseStack.api,
    });
  }
}
