function loadImplementation() {
  try {
    return require('./error-correction-code.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./error-correction-code.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
