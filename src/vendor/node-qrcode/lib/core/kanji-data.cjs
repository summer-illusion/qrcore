function loadImplementation() {
  try {
    return require('./kanji-data.ts')
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') throw error
    return require('./kanji-data.impl.cjs')
  }
}

const implementation = loadImplementation()

module.exports = implementation.default || implementation
