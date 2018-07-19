const { events } = require('brigadier')
const { deploy } = require('./deploy')
const { destroyDev } = require('./destroyDev')
const { getGitPRAction } = require('./utils')

events.on('deploy', async (event, project) => {
  await deploy({
    event,
    project,
  })
})

events.on('deploy-dry-run', async (event, project) => {
  await deploy({
    event,
    project,
    dryRunOnly: true,
  })
})

events.on('deploy-dev', async (event, project) => {
  await deploy({
    event,
    project,
    devDeploy: true,
  })
})

events.on('destroy-dev', async (event, project) => {
  await destroyDev({
    event,
    project,
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
