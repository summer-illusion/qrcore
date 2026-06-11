import { createRequire } from 'node:module'

import type * as UtilsModule from './utils.ts'

const require = createRequire(import.meta.url)
const Utils = require('./utils.cjs') as typeof UtilsModule

const TEST_NUMERIC = /^[0-9]+$/
const TEST_ALPHANUMERIC = /^[A-Z0-9 $%*+\-./:]+$/

export function testKanji(str: string): boolean | number {
  if (!Utils.isKanjiModeEnabled()) {
    return false
  }

  let flag: boolean | number = true
  for (const char of str) {
    flag = flag && Utils.toSJIS(char)
  }

  return flag
}

export function testNumeric(str: string): boolean {
  return TEST_NUMERIC.test(str)
}

export function testAlphanumeric(str: string): boolean {
  return TEST_ALPHANUMERIC.test(str)
}

function isModeFactory(charCollection: string) {
  const map = new Map<number | undefined, number>()
  for (let i = 0; i < charCollection.length; ++i) {
    map.set(charCollection.codePointAt(i), i)
  }

  return function isMode(str: string, pos: number): boolean {
    return map.has(str.codePointAt(pos))
  }
}

export const isNumeric = isModeFactory('0123456789')
export const isAlphanumeric = isModeFactory(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',
)

export function isKanji(str: string, pos: number): boolean {
  const unicode = str.codePointAt(pos)
  return (
    typeof unicode !== 'undefined' &&
    Utils.isKanjiModeEnabled() &&
    Boolean(Utils.toSJIS(String.fromCodePoint(unicode)))
  )
}

export default {
  isAlphanumeric,
  isKanji,
  isNumeric,
  testAlphanumeric,
  testKanji,
  testNumeric,
}
