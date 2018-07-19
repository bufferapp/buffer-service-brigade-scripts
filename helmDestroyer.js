const { Job } = require('brigadier')
const { echoedTasks } = require('./utils')

const helmDestroyerJob = async ({ releaseName, chartmuseumUrl }) => {
  const helmDestroyer = new Job('helm-destroyer', 'linkyard/docker-helm:2.8.2')
  helmDestroyer.tasks = echoedTasks([
    'cd /src',
    'helm init --client-only',
    `helm repo add bufferapp ${chartmuseumUrl}`,
    `helm del --purge ${releaseName}`,
  ])
  await helmDestroyer.run()
}

module.exports = {
  helmDestroyerJob,
}
