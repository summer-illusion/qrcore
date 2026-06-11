function loadImplementation() {
  try {
    return require('./alphanumeric-data.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./alphanumeric-data.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
