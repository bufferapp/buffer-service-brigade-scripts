const { Job } = require('brigadier')
const { echoedTasks, generateHelmCommand } = require('./utils')

const helmDeployerJob = async ({
  event,
  releaseName,
  appName,
  namespace,
  chartmuseumUrl,
  valuesPath,
  helmChart,
  envVars,
  values,
  dryRunOnly,
  devDeploy,
}) => {
  const helmDeployer = new Job('helm-deployer', 'linkyard/docker-helm:2.8.2')
  const tasks = [
    'cd /src',
    'helm init --client-only',
    `helm repo add bufferapp ${chartmuseumUrl}`,
    generateHelmCommand({
      releaseName,
      appName,
      helmChart,
      namespace,
      event,
      values,
      valuesPath,
      envVars,
      dryRun: true,
      devDeploy,
    }),
  ]
  if (!dryRunOnly) {
    tasks.push(
      generateHelmCommand({
        releaseName,
        appName,
        helmChart,
        namespace,
        event,
        values,
        valuesPath,
        envVars,
        dryRun: false,
        devDeploy,
      }),
    )
  }
  helmDeployer.tasks = echoedTasks(tasks)
  await helmDeployer.run()
}

module.exports = {
  helmDeployerJob,
}
