const { githubStatusJob } = require('./githubStatusJob')
const { yamlToJsonJob } = require('./yamlToJsonJob')
const { helmDestroyerJob } = require('./helmDestroyerJob')
const { releaseName } = require('./utils')

const destroyDev = async ({ brigade, event, project, chartmuseumUrl, valuesPath }) => {
  const target = `https://kashti.buffer.com/#!/build/${event.buildID}`

  await githubStatusJob({
    brigade,
    event,
    project,
    state: 'pending',
    status: 'Destroying Dev Application...',
    target,
  })
  try {
    const values = await yamlToJsonJob({
      brigade,
      valuesPath,
    })
    const { name } = values
    await helmDestroyerJob({
      brigade,
      releaseName: releaseName({ event, name }),
      chartmuseumUrl,
    })

    await githubStatusJob({
      brigade,
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
      brigade,
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
