function loadImplementation() {
  try {
    return require('./numeric-data.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./numeric-data.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
