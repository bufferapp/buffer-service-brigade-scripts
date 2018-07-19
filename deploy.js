const { githubStatusJob } = require('./githubStatusJob')
const { yamlToJsonJob } = require('./yamlToJsonJob')
const { dockerBuildJob } = require('./dockerBuildJob')
const { helmDeployerJob } = require('./helmDeployerJob')
const { releaseName, appName, generateHostOverride } = require('./utils')

const deploy = async ({ event, project, dryRunOnly, devDeploy }) => {
  const valuesPath = 'values.yaml'
  const chartmuseumUrl = 'http://chartmuseum-chartmuseum.default'
  const helmChart = 'buffer-service'
  const target = `https://kashti.buffer.com/#!/build/${event.buildID}`
  const envVars = [
    {
      name: 'MONGO_URL',
      value: project.secrets.MONGO_URL,
    },
    {
      name: 'MONGO_DATABASE',
      value: project.secrets.MONGO_DATABASE,
    },
    {
      name: 'BUGSNAG_KEY',
      value: project.secrets.BUGSNAG_KEY,
    },
    {
      name: 'RELEASE_TRACK',
      value: devDeploy ? 'dev' : 'stable',
    },
  ]
  await githubStatusJob({
    event,
    project,
    state: 'pending',
    status: 'Deploying Application...',
    target,
  })
  try {
    const values = await yamlToJsonJob({
      valuesPath,
    })
    const {
      name,
      namespace,
      image: { repository: appDockerImage },
    } = values
    await dockerBuildJob({ event, project, appDockerImage })
    await helmDeployerJob({
      event,
      releaseName: releaseName({ event, name }),
      appName: appName({ event, name }),
      namespace: devDeploy ? 'dev' : namespace,
      chartmuseumUrl,
      valuesPath,
      helmChart,
      values,
      envVars,
      dryRunOnly,
      devDeploy,
    })
    await githubStatusJob({
      event,
      project,
      state: 'success',
      status: 'Deploy Complete',
      target,
    })
    if (
      devDeploy &&
      values.ingress &&
      values.ingress.enabled &&
      values.ingress.host
    ) {
      await githubStatusJob({
        event,
        project,
        state: 'success',
        status: 'Deploy Dev Ingress Complete',
        target: `https://${generateHostOverride({ event, values })}`,
        context: 'Brigade - Dev Ingress URL',
      })
    }
  } catch (error) {
    console.log('There was an error during deployment')
    console.log('error.message', error.message)
    console.log('error.stack', error.stack)
    await githubStatusJob({
      event,
      project,
      state: 'failure',
      status: 'Deploy Failed',
      target,
    })
  }
}

module.exports = {
  deploy,
}
