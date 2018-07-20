const { deploy } = require('./deploy')
const { destroyDev } = require('./destroyDev')
const { getGitPRAction } = require('./utils')

const DEFAULT_CHARTMUSEUM_URL = 'http://chartmuseum-chartmuseum.default'

module.exports = ({ brigade, chartmuseumUrl }) => {
  const chartmuseumUrlValue = chartmuseumUrl || DEFAULT_CHARTMUSEUM_URL
  const { events } = brigade
  events.on('deploy', async (event, project) => {
    await deploy({
      brigade,
      event,
      project,
      chartmuseumUrl: chartmuseumUrlValue,
    })
  })

  events.on('deploy-dry-run', async (event, project) => {
    await deploy({
      brigade,
      event,
      project,
      dryRunOnly: true,
      chartmuseumUrl: chartmuseumUrlValue,
    })
  })

  events.on('deploy-dev', async (event, project) => {
    await deploy({
      brigade,
      event,
      project,
      devDeploy: true,
      chartmuseumUrl: chartmuseumUrlValue,
    })
  })

  events.on('destroy-dev', async (event, project) => {
    await destroyDev({
      brigade,
      event,
      project,
      chartmuseumUrl: chartmuseumUrlValue,
    })
  })

  events.on('push', async (event, project) => {
    if (event.revision.ref === 'refs/heads/master') {
      events.emit('deploy', event, project)
    }
  })

  events.on('pull_request', async (event, payload) => {
    const action = getGitPRAction({ event })
    if (['opened', 'reopened', 'synchronize'].includes(action)) {
      events.emit('deploy-dev', event, payload)
    } else if (action === 'closed') {
      events.emit('destroy-dev', event, payload)
    }
  })

  events.on('exec', async (event, project) => {
    events.emit('deploy', event, project)
  })
}
