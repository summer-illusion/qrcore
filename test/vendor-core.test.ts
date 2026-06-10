import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

import BitBuffer from '../src/vendor/node-qrcode/lib/core/bit-buffer.ts'
import BitMatrix from '../src/vendor/node-qrcode/lib/core/bit-matrix.ts'
import {
  exp,
  log,
  mul,
} from '../src/vendor/node-qrcode/lib/core/galois-field.ts'
import { isValid } from '../src/vendor/node-qrcode/lib/core/version-check.ts'

const require = createRequire(import.meta.url)

describe('migrated node-qrcode core modules', () => {
  it('keeps galois field arithmetic stable', () => {
    expect(log(1)).toBe(0)
    expect(exp(0)).toBe(1)
    expect(mul(7, 3)).toBe(9)
    expect(mul(0, 7)).toBe(0)
    expect(() => log(0)).toThrow('log(0)')
  })

  it('validates QR versions with upstream boundaries', () => {
    expect(isValid(1)).toBe(true)
    expect(isValid('7')).toBe(true)
    expect(isValid(40)).toBe(true)
    expect(isValid(0)).toBe(false)
    expect(isValid(41)).toBe(false)
    expect(isValid(Number.NaN)).toBe(false)
  })

  it('preserves bit buffer writes and reads', () => {
    const buffer = new BitBuffer()

    buffer.put(0b101, 3)
    buffer.putBit(false)
    buffer.put(0b11, 2)

    expect(buffer.getLengthInBits()).toBe(6)
    expect(Array.from({ length: 6 }, (_, index) => buffer.get(index))).toEqual([
      true,
      false,
      true,
      false,
      true,
      true,
    ])
  })

  it('preserves bit matrix mutation semantics', () => {
    const matrix = new BitMatrix(2)

    matrix.set(0, 1, true, true)
    expect(matrix.get(0, 1)).toBe(1)
    expect(matrix.isReserved(0, 1)).toBe(1)

    matrix.xor(0, 1, true)
    expect(matrix.get(0, 1)).toBe(0)
  })

  it('keeps CommonJS compatibility shims synchronous', () => {
    const GF = require('../src/vendor/node-qrcode/lib/core/galois-field.cjs')
    const VersionCheck = require('../src/vendor/node-qrcode/lib/core/version-check.cjs')
    const CjsBitBuffer = require('../src/vendor/node-qrcode/lib/core/bit-buffer.cjs')
    const CjsBitMatrix = require('../src/vendor/node-qrcode/lib/core/bit-matrix.cjs')

    expect(GF.mul(7, 3)).toBe(9)
    expect(VersionCheck.isValid(40)).toBe(true)
    expect(new CjsBitBuffer().getLengthInBits()).toBe(0)
    expect(new CjsBitMatrix(1).size).toBe(1)
  })
})
