const MAX_RELEASE_NAME_LENGTH = 53
const MAX_APP_NAME_LENGTH = 63
const MAX_LABEL_LENGTH = 63

const getGitPRAction = ({ event }) => JSON.parse(event.payload).action

// getting branch names from pull_request's are slightly different
const getGitPRBranch = ({ event }) => {
  return JSON.parse(event.payload).pull_request.head.ref
}

const getGitBranch = ({ event }) => {
  try {
    return getGitPRBranch({ event })
  } catch (err) {
    return event.revision.ref.replace('refs/heads/', '')
  }
}

const getGitSha = ({ event }) => event.revision.commit

// returns a branch name that can be used for service and helm deployment name
const getFormattedBranch = ({ event }) =>
  getGitBranch({ event })
    .replace(/\//g, '-')
    .substr(0, MAX_LABEL_LENGTH)

const releaseName = ({ event, name }) =>
  `${name}-${getFormattedBranch({ event })}`.substr(0, MAX_RELEASE_NAME_LENGTH)

const appName = ({ event, name }) => {
  const branch = getFormattedBranch({ event })
  if (branch === 'master') {
    return name.substr(0, MAX_APP_NAME_LENGTH)
  }
  return `${name}-${getFormattedBranch({ event })}`.substr(
    0,
    MAX_APP_NAME_LENGTH,
  )
}

const echoedTasks = tasks => {
  const echoTasks = []
  tasks.forEach(task => {
    echoTasks.push(`echo "Doing Task: '${task}'"`)
    echoTasks.push(task)
  })
  return echoTasks
}

const injectEnvVars = ({ existingEnvVars = [], envVars = [] }) => {
  const output = envVars
    .filter(item => item.name && item.value)
    .map(
      (item, i) =>
        `--set env[${i + existingEnvVars.length}].name=${item.name},env[${i +
          existingEnvVars.length}].value=${item.value}`,
    )
    .join(' ')
  return output
}

const generateHostOverride = ({ event, values }) =>
  `${getFormattedBranch({ event })}-${values.ingress.host}`

const generateHostOverrideHelmCommand = ({ event, values, devDeploy }) => {
  if (
    devDeploy &&
    values.ingress &&
    values.ingress.enabled &&
    values.ingress.host
  ) {
    return `--set ingress.host=${generateHostOverride({ event, values })}`
  }
  return ''
}

const generateHelmCommand = ({
  releaseName,
  appName,
  helmChart,
  namespace,
  event,
  values,
  valuesPath,
  envVars,
  dryRun,
  devDeploy,
}) =>
  `helm upgrade --install ${releaseName} bufferapp/${helmChart} --namespace ${namespace} --values ${valuesPath} --set name=${appName} --set image.tag=${getGitSha(
    { event },
  )} --set gitSha=${getGitSha({ event })} --set gitBranch=${getFormattedBranch({
    event,
  })} ${injectEnvVars({
    existingEnvVars: values.env,
    envVars,
  })} ${generateHostOverrideHelmCommand({ event, values, devDeploy })}${
    dryRun ? ' --debug --dry-run' : ''
  }`

const formatEnvVars = ({ project, envVars }) => envVars.map(envVar => {
  if (!envVar.name || !(envVar.projectSecret || envVar.value)) {
    throw new Error('A name and projectSecret or value must be specified in the envVar parameter')
  }
  if (envVar.projectSecret && project.secrets[envVar.projectSecret] === undefined) {
    throw new Error(
      `An undefined projectSecret envVar has been specified ${envVar.name} - ${envVar.projectSecret}`)
  }
  return {
    name: envVar.name,
    value: envVar.projectSecret ? project.secrets[envVar.projectSecret] : envVar.value,
  }
})

// devDeploys: [
//   {
//     branch: /^*?/,
//     namespace: 'dev',
//   },
// ],
const devDeployNamespace = ({ devDeploys, branch }) =>
  devDeploys.reduce((namespace, branch) => {
    if (namespace) {
      return namespace
    } else if (devDeploy.branch.test(branch)) {
      console.log(`branch ${branch} matched ${devDeploy.branch.toString()}, working on namespace ${namespace}`)
      return devDeploy.namespace
    }
  }, undefined)

module.exports = {
  getGitPRAction,
  getGitBranch,
  appName,
  releaseName,
  echoedTasks,
  generateHelmCommand,
  formatEnvVars,
  devDeployNamespace,
}
