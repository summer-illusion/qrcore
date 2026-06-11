function loadImplementation() {
  try {
    return require('./can-promise.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./can-promise.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
