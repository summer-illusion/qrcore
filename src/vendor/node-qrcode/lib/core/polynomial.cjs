function loadImplementation() {
  try {
    return require('./polynomial.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./polynomial.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
