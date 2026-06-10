function loadImplementation() {
  try {
    return require('./index.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./index.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
