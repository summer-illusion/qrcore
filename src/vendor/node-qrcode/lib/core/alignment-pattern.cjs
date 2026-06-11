function loadImplementation() {
  try {
    return require('./alignment-pattern.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./alignment-pattern.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
