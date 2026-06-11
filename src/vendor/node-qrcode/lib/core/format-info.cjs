function loadImplementation() {
  try {
    return require('./format-info.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./format-info.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
