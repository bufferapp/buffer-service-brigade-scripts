const { deploy } = require('./deploy')
const { destroyDev } = require('./destroyDev')
const { getGitPRAction, getGitBranch, devDeployNamespace } = require('./utils')

const DEFAULT_CHARTMUSEUM_URL = 'http://chartmuseum-chartmuseum.default'
const DEFAULT_VALUES_PATH = 'values.yaml'
const DEFAULT_HELM_CHART = 'buffer-service'

module.exports = ({
  brigade,
  chartmuseumUrl,
  valuesPath,
  helmChart,
  envVars,
  devDeploys,
  deployDryRun,
}) => {
  const chartmuseumUrlValue = chartmuseumUrl || DEFAULT_CHARTMUSEUM_URL
  const valuesPathValue = valuesPath || DEFAULT_VALUES_PATH
  const helmChartValue = helmChart || DEFAULT_HELM_CHART
  const envVarsValue = envVars || []
  const devDeploysValue = devDeploys || []
  const { events } = brigade

  events.on('deploy', async (event, project) => {
    await deploy({
      brigade,
      event,
      project,
      chartmuseumUrl: chartmuseumUrlValue,
      valuesPath: valuesPathValue,
      helmChart: helmChartValue,
      envVars: envVarsValue,
    })
  })

  events.on('deploy-dry-run', async (event, project) => {
    await deploy({
      brigade,
      event,
      project,
      dryRunOnly: true,
      chartmuseumUrl: chartmuseumUrlValue,
      valuesPath: valuesPathValue,
      helmChart: helmChartValue,
      envVars: envVarsValue,
    })
  })

  events.on('deploy-dev', async (event, project) => {
    const namespace = devDeployNamespace({
      branch: getGitBranch({ event }),
      devDeploys: devDeploysValue,
    })
    if (namespace) {
      await deploy({
        brigade,
        event,
        project,
        devDeploy: true,
        chartmuseumUrl: chartmuseumUrlValue,
        valuesPath: valuesPathValue,
        helmChart: helmChartValue,
        envVars: envVarsValue,
        namespaceOverride: namespace,
      })
    }
  })

  events.on('destroy-dev', async (event, project) => {
    const namespace = devDeployNamespace({
      branch: getGitBranch({ event }),
      devDeploys: devDeploysValue,
    })
    if (namespace) {
      await destroyDev({
        brigade,
        event,
        project,
        chartmuseumUrl: chartmuseumUrlValue,
        valuesPath: valuesPathValue,
      })
    }
  })

  events.on('push', async (event, project) => {
    if (event.revision.ref === 'refs/heads/master') {
      events.emit('deploy', event, project)
    }
  })

  events.on('pull_request', async (event, payload) => {
    const action = getGitPRAction({ event })
    if (['opened', 'reopened', 'synchronize'].includes(action)) {
      if (deployDryRun) {
        events.emit('deploy-dry-run', event, payload)
      } else {
        events.emit('deploy-dev', event, payload)
      }
    } else if (action === 'closed') {
      if (!deployDryRun) {
        events.emit('destroy-dev', event, payload)
      }
    }
  })

  events.on('exec', async (event, project) => {
    events.emit('deploy', event, project)
  })
}
