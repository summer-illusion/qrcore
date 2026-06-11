function loadImplementation() {
  try {
    return require('./segments.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./segments.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
