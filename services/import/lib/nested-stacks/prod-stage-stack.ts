import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

interface ProdStageStackProps extends cdk.StackProps {
  api: apigateway.RestApi;
}

const STAGE_NAME = 'prod';

export class ImportProdStageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ProdStageStackProps) {
    super(scope, id, props);

    const deployment = new apigateway.Deployment(
      this,
      `ImportServiceProdDeployment${Date.now().valueOf()}`,
      {
        api: props.api,
      }
    );

    const stage = new apigateway.Stage(this, 'ImportServiceProdStage', {
      deployment,
      stageName: STAGE_NAME,
    });

    new cdk.CfnOutput(this, 'ImportServiceProdApiUrl', {
      value: stage.urlForPath(),
      exportName: 'ImportServiceProdApiUrl',
    });
  }
}
