function loadImplementation() {
  try {
    return require('./png.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./png.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
