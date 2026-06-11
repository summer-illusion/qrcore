function loadImplementation() {
  try {
    return require('./byte-data.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./byte-data.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
