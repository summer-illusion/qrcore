function loadImplementation() {
  try {
    return require('./bit-matrix.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./bit-matrix.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
