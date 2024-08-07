# nodejs-aws-shop-services

This is backend services for nodejs-aws mentoring program.

## Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.
- Docker - [Download & Install Docker](https://docs.docker.com/engine/install/).

## Documentation

Product Service API: [Swagger doc](./services/products/doc/api.yaml)

Import Service API: [Swagger doc](./services/import/doc/api.yaml)

_**Attention!** To deploy Import Service you have to rename `.env.example` file to `.env` and write ARN of your Create Product Queue (which is shown by cdk output after deploying Products Service) to CREATE_PRODUCT_QUEUE_ARN env value_

## Shop products data

[products.csv](./services/import/src/data/products.csv)

## Deployment

Product Service API: https://od2fzpzaa0.execute-api.eu-central-1.amazonaws.com/dev/products

Import Service API: https://nsr51h1em5.execute-api.eu-central-1.amazonaws.com/dev/import

## Frontend Application

Repository: https://github.com/lobovskiy/nodejs-aws-shop-react

Cloudfront deployment URL: https://d1253iq9i8ynf5.cloudfront.net

## Technologies

The project uses the following technologies:

- [AWS Cloud Development Kit](https://aws.amazon.com/cdk/) as an AWS building tool
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) as an API for AWS services
- [Yup](https://github.com/jquense/yup) as a validation schema
- [jest](https://jestjs.io/) as a test runner
- [Eslint](https://eslint.org/) as a code linting tool
- [Prettier](https://prettier.io/) as a code formatting tool
- [TypeScript](https://www.typescriptlang.org/) as a type checking tool

## Available Scripts for Products Service in `/services/products` and Import Service in `/services/import`

### `build`

Builds the project for production in `dist` folder.

### `watch`

Runs the project in watch mode.

### `test`

Runs tests in console.

### `lint`

Runs linting for all files in `src` folder.

### `cdk:bootstrap`

Bootstrap AWS environment for CDK.

### `cdk:deploy:dev`

Deploy app stack on the `dev` stage in the current AWS account and region

### `cdk:deploy:prod`

Deploy app stack on the `prod` stage in the current AWS account and region

### `db:seed` (available for Products Service)

Seeds app database tables with mock data from `/services/products/__mocks__`

### `cdk:destroy`

Remove deployed app stacks and associated resources on all the stages.
