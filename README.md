# buffer-service-brigade-scripts

NPM Package for brigade scripts

## Example Configuration

### brigade.js

This script gets called that triggers deployments

```js
const brigade = require('brigadier')
const scripts = require('@bufferapp/buffer-service-brigade-scripts')

scripts({
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
