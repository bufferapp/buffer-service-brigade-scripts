const { githubStatusJob } = require('./githubStatusJob')
const { yamlToJsonJob } = require('./yamlToJsonJob')
const { dockerBuildJob } = require('./dockerBuildJob')
const { helmDeployerJob } = require('./helmDeployerJob')
const { releaseName, appName, generateHostOverride, formatEnvVars } = require('./utils')

const deploy = async ({ brigade, event, project, dryRunOnly, devDeploy, chartmuseumUrl, valuesPath, helmChart, envVars }) => {
  const target = `https://kashti.buffer.com/#!/build/${event.buildID}`
  const envVarsValue = formatEnvVars({
    project,
    envVars: [
      {
        name: 'RELEASE_TRACK',
        value: devDeploy ? 'dev' : 'stable',
      },
      ...envVars,
    ]
  })
  await githubStatusJob({
    brigade,
    event,
    project,
    state: 'pending',
    status: 'Deploying Application...',
    target,
  })
  try {
    const values = await yamlToJsonJob({
      brigade,
      valuesPath,
    })
    const {
      name,
      namespace,
      image: { repository: appDockerImage },
    } = values
    await dockerBuildJob({ brigade, event, project, appDockerImage })
    await helmDeployerJob({
      brigade,
      event,
      releaseName: releaseName({ event, name }),
      appName: appName({ event, name }),
      namespace: devDeploy ? 'dev' : namespace,
      chartmuseumUrl,
      valuesPath,
      helmChart,
      values,
      envVars: envVarsValue,
      dryRunOnly,
      devDeploy,
    })
    await githubStatusJob({
      brigade,
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
        brigade,
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
      brigade,
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
