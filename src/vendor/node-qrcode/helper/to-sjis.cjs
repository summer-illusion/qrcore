function loadImplementation() {
  try {
    return require('./to-sjis.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./to-sjis.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
