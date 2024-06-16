import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

interface ProdStageStackProps extends cdk.StackProps {
  api: apigateway.RestApi;
}

export class ProductsProdStageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ProdStageStackProps) {
    super(scope, id, props);

    const deployment = new apigateway.Deployment(this, 'ProdDeployment', {
      api: props.api,
    });

    const stage = new apigateway.Stage(this, 'DevStage', {
      deployment,
      stageName: 'prod',
    });

    new cdk.CfnOutput(this, 'ProdApiUrl', {
      value: stage.urlForPath(),
      exportName: 'ProdApiUrl',
    });
  }
}
