function loadImplementation() {
  try {
    return require('./finder-pattern.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./finder-pattern.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
