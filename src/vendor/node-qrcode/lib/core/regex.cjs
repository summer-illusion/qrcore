const Utils = require('./utils.cjs')

const TEST_NUMERIC = new RegExp('^[0-9]+$')
const TEST_ALPHANUMERIC = new RegExp('^[A-Z0-9 $%*+\\-./:]+$')

exports.testKanji = function testKanji (str) {
  if (!Utils.isKanjiModeEnabled()) {
    return false
  }

  let flag = true
  for (const char of str) {
    flag = flag && Utils.toSJIS(char)
  }

  return flag
}

exports.testNumeric = function testNumeric (str) {
  return TEST_NUMERIC.test(str)
}

exports.testAlphanumeric = function testAlphanumeric (str) {
  return TEST_ALPHANUMERIC.test(str)
}

function isModeFactory (charCollection) {
  const map = new Map()
  for (let i = 0; i < charCollection.length; ++i) {
    map.set(charCollection.codePointAt(i), i)
  }

  return function isMode (str, pos) {
    return map.has(str.codePointAt(pos))
  }
}

exports.isNumeric = isModeFactory('0123456789')

exports.isAlphanumeric = isModeFactory('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:')

exports.isKanji = function isKanji (str, pos) {
  const unicode = str.codePointAt(pos)
  return Utils.isKanjiModeEnabled() && !!Utils.toSJIS(String.fromCodePoint(unicode))
}
