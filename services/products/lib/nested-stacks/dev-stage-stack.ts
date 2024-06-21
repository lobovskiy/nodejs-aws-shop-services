import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

interface DevStageStackProps extends cdk.StackProps {
  api: apigateway.RestApi;
}

const STAGE_NAME = 'dev';

export class ProductsDevStageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DevStageStackProps) {
    super(scope, id, props);

    const deployment = new apigateway.Deployment(
      this,
      `DevDeployment-${Date.now().valueOf()}`,
      {
        api: props.api,
      }
    );

    const stage = new apigateway.Stage(this, 'DevStage', {
      deployment,
      stageName: STAGE_NAME,
    });

    new cdk.CfnOutput(this, 'DevApiUrl', {
      value: stage.urlForPath(),
      exportName: 'DevApiUrl',
    });
  }
}
