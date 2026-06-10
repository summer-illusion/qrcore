function loadImplementation() {
  try {
    return require('./regex.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./regex.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
