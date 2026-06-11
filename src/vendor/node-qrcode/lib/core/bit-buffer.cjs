function loadImplementation() {
  try {
    return require('./bit-buffer.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./bit-buffer.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
