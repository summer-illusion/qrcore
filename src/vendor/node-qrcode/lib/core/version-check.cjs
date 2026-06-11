function loadImplementation() {
  try {
    return require('./version-check.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./version-check.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
