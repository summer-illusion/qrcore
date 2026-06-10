function loadImplementation() {
  try {
    return require('./terminal.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./terminal.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
