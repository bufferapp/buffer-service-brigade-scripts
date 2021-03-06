const yamlToJsonJob = async ({ brigade, valuesPath }) => {
  const { Job } = brigade
  const yaml2json = new Job('yaml2json', 'simplealpine/yaml2json')
  yaml2json.tasks = ['cd /src', `yaml2json < ${valuesPath}`]
  const jsonValues = await yaml2json.run()
  return jsonValues.toString()
}

module.exports = {
  yamlToJsonJob,
}
