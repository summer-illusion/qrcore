function loadImplementation() {
  try {
    return require('./svg-tag.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./svg-tag.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
