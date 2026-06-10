function loadImplementation() {
  try {
    return require('./server.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./server.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
