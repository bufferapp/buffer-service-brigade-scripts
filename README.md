# buffer-service-brigade-scripts

NPM Package for brigade scripts

## Table Of Contents

- [Quickstart](#quickstart)
- [Example Configuration](#example-configuration)

## Quickstart

### Create A Brigade Project

A brigade project uses a secret to be used as configuration, sensitive information can be stored in the file that can be used during the deployment phase -- things like ENV vars with keys.

Create an example brigade secret file (lets call in my-app-secrets.yaml): https://github.com/Azure/brigade/blob/master/docs/topics/github.md#configuring-your-project


Deploy the brigade project with helm

```sh
helm upgrade --install my-app-secrets brigade/brigade-project -f my-app-secrets.yaml --namespace brigade
```

### Hook Up The Webhook on github

Follow these instructions on the repo you'd like to deploy with `https://brigade-gateway.buffer.com/events/github` as YOUR_HOSTNAME:

https://github.com/Azure/brigade/blob/master/docs/topics/github.md#configuring-github

### Configure The Repo

There are usually three parts to this

- values.yaml [example](https://github.com/bufferapp/helm-chart-base-templates/blob/master/buffer-service/values.yaml)
- brigade.js [example](https://github.com/bufferapp/core-authentication-service/blob/master/brigade.js)
- brigade.json [example](https://github.com/bufferapp/core-authentication-service/blob/master/brigade.json)

A full list of configuration options for this package can be found in the [Example Configuration](#example-configuration) section.

## Example Configuration

### brigade.js

This script gets called that triggers deployments

```js
const brigade = require('brigadier')
const brigadeScripts = require('@bufferapp/buffer-service-brigade-scripts')

brigadeScripts({
  brigade,
  chartmuseumUrl: 'http://chartmuseum-chartmuseum.default', // default
  valuesPath: 'values.yaml', // default
  helmChart: 'buffer-service', // default
  // environment vars to set on container
  // (on top of any set in the values.yaml)
  envVars: [
    {
      name: 'MONGO_URL',
      projectSecret: 'MONGO_URL',
    },
    {
      name: 'MONGO_DATABASE',
      projectSecret: 'MONGO_DATABASE',
    },
    {
      name: 'BUGSNAG_KEY',
      projectSecret: 'BUGSNAG_KEY',
    },
    // can also specify a value if you wanted to
    // {
    //   name: 'SOME_ENV_VAR_NAME',
    //   value: 'SOME_ENV_VAR_VALUE',
    // },
  ],
  // deploy to a namespace when a branch PR is opened or synced
  // destroys when the PR is closed
  // chooses the first namespace in the list where the branch matches the regex
  // this one does all dev deploys onto the dev namespace
  devDeploys: [
    // {
    //   branch: /^reply-dev$/,
    //   namespace: 'reply-dev',
    // },
    {
      branch: /.*/,
      namespace: 'dev',
    },
  ],
  // set to true to do a dry run on PR opened or synced
  // overrides devDeploys
  // does not change default branch behavior
  deployDryRun: false,
})
```

### brigade.json

Describes which version of the scripts to use

```json
{
  "dependencies": {
    "@bufferapp/buffer-service-brigade-scripts": "0.0.1"
  }
}
```
