function loadImplementation() {
  try {
    return require('./browser.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./browser.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
