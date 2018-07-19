const { githubStatusJob } = require('./githubStatusJob')
const { yamlToJsonJob } = require('./yamlToJsonJob')
const { helmDestroyerJob } = require('./helmDestroyerJob')
const { releaseName } = require('./utils')

const destroyDev = async ({ event, project }) => {
  const target = `https://kashti.buffer.com/#!/build/${event.buildID}`
  const valuesPath = 'values.yaml'
  const chartmuseumUrl = 'http://chartmuseum-chartmuseum.default'

  await githubStatusJob({
    event,
    project,
    state: 'pending',
    status: 'Destroying Dev Application...',
    target,
  })
  try {
    const values = await yamlToJsonJob({
      valuesPath,
    })
    const { name } = values
    await helmDestroyerJob({
      releaseName: releaseName({ event, name }),
      chartmuseumUrl,
    })

    await githubStatusJob({
      event,
      project,
      state: 'success',
      status: 'Destroy Dev Complete',
      target,
    })
  } catch (error) {
    console.log('There was an error during dev destroy')
    console.log('error.message', error.message)
    console.log('error.stack', error.stack)
    await githubStatusJob({
      event,
      project,
      state: 'failure',
      status: 'Destroy Dev Failed',
      target,
    })
  }
}

module.exports = {
  destroyDev,
}
