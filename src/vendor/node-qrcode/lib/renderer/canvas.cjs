function loadImplementation() {
  try {
    return require('./canvas.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./canvas.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
