const { Job } = require('brigadier')

let id = 0
const generateGithubStatusId = () => id++

const githubStatusJob = async ({
  event,
  project,
  state,
  status,
  target,
  context,
}) => {
  const githubStatus = new Job(
    `set-github-build-status-${generateGithubStatusId()}`,
    'technosophos/github-notify:latest',
  )
  githubStatus.env = {
    GH_REPO: project.repo.name,
    GH_STATE: state,
    GH_DESCRIPTION: status,
    GH_CONTEXT: context || 'Brigade',
    GH_TOKEN: project.repo.token,
    GH_COMMIT: event.revision.commit,
  }
  if (target) {
    githubStatus.env.GH_TARGET_URL = target
  }
  await githubStatus.run()
}

module.exports = {
  githubStatusJob,
}
