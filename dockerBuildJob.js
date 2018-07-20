const { echoedTasks } = require('./utils')

const dockerBuildJob = async ({ brigade, event, project, appDockerImage }) => {
  const { Job } = brigade
  const dockerBuilder = new Job('docker-builder', 'docker:stable-dind')
  dockerBuilder.privileged = true
  dockerBuilder.env = {
    DOCKER_DRIVER: project.secrets.DOCKER_DRIVER || 'overlay',
  }
  dockerBuilder.tasks = echoedTasks([
    'dockerd-entrypoint.sh &',
    'sleep 20',
    'cd /src',
    `docker login -u ${project.secrets.DOCKER_USER} -p '${
      project.secrets.DOCKER_PASS
    }' ${project.secrets.DOCKER_REGISTRY}`,
    `docker build -t ${appDockerImage}:${event.revision.commit} .`,
    `docker push ${appDockerImage}:${event.revision.commit}`,
  ])
  await dockerBuilder.run()
}

module.exports = {
  dockerBuildJob,
}
