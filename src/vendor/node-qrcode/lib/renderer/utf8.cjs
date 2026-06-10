function loadImplementation() {
  try {
    return require('./utf8.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./utf8.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
