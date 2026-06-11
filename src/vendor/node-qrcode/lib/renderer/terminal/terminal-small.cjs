function loadImplementation() {
  try {
    return require('./terminal-small.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./terminal-small.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
