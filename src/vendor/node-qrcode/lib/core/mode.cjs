function loadImplementation() {
  try {
    return require('./mode.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./mode.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
