#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import 'dotenv/config';

import { AuthorizationStack } from '../lib/authorization-stack';

const app = new cdk.App();
new AuthorizationStack(app, 'AuthorizationServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
