import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

import * as AlignmentPattern from '../src/vendor/node-qrcode/lib/core/alignment-pattern.ts'
import AlphanumericData from '../src/vendor/node-qrcode/lib/core/alphanumeric-data.ts'
import BitBuffer from '../src/vendor/node-qrcode/lib/core/bit-buffer.ts'
import BitMatrix from '../src/vendor/node-qrcode/lib/core/bit-matrix.ts'
import ByteData from '../src/vendor/node-qrcode/lib/core/byte-data.ts'
import * as ECCode from '../src/vendor/node-qrcode/lib/core/error-correction-code.ts'
import * as ECLevel from '../src/vendor/node-qrcode/lib/core/error-correction-level.ts'
import * as FinderPattern from '../src/vendor/node-qrcode/lib/core/finder-pattern.ts'
import * as FormatInfo from '../src/vendor/node-qrcode/lib/core/format-info.ts'
import {
  exp,
  log,
  mul,
} from '../src/vendor/node-qrcode/lib/core/galois-field.ts'
import KanjiData from '../src/vendor/node-qrcode/lib/core/kanji-data.ts'
import * as MaskPattern from '../src/vendor/node-qrcode/lib/core/mask-pattern.ts'
import * as Mode from '../src/vendor/node-qrcode/lib/core/mode.ts'
import NumericData from '../src/vendor/node-qrcode/lib/core/numeric-data.ts'
import * as Polynomial from '../src/vendor/node-qrcode/lib/core/polynomial.ts'
import ReedSolomonEncoder from '../src/vendor/node-qrcode/lib/core/reed-solomon-encoder.ts'
import * as Regex from '../src/vendor/node-qrcode/lib/core/regex.ts'
import * as Utils from '../src/vendor/node-qrcode/lib/core/utils.ts'
import * as Version from '../src/vendor/node-qrcode/lib/core/version.ts'
import { isValid } from '../src/vendor/node-qrcode/lib/core/version-check.ts'

const require = createRequire(import.meta.url)
const ECLevelCjs =
  require('../src/vendor/node-qrcode/lib/core/error-correction-level.cjs') as typeof ECLevel
const ModeCjs =
  require('../src/vendor/node-qrcode/lib/core/mode.cjs') as typeof Mode
const UtilsCjs =
  require('../src/vendor/node-qrcode/lib/core/utils.cjs') as typeof Utils
const testToSJIS = (kanji: string) =>
  (
    ({
      漢: 0x8abf,
      字: 0x8e9a,
    }) as Record<string, number | undefined>
  )[kanji] ?? 0

function bitsFor(data: { write(bitBuffer: BitBuffer): void }): {
  length: number
  bytes: number[]
} {
  const bitBuffer = new BitBuffer()
  data.write(bitBuffer)
  return {
    length: bitBuffer.getLengthInBits(),
    bytes: bitBuffer.buffer,
  }
}

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

  it('keeps utility helpers and shared SJIS state stable', () => {
    expect(Utils.getSymbolSize(1)).toBe(21)
    expect(Utils.getSymbolTotalCodewords(1)).toBe(26)
    expect(Utils.getBCHDigit(0)).toBe(0)
    expect(Utils.getBCHDigit(0b1000)).toBe(4)
    expect(Utils.isKanjiModeEnabled()).toBe(false)

    Utils.setToSJISFunction(testToSJIS)

    expect(Utils.isKanjiModeEnabled()).toBe(true)
    expect(Utils.toSJIS('漢')).toBe(0x8abf)
    expect(Utils.toSJIS('A')).toBe(0)
  })

  it('keeps regex and mode decisions compatible', () => {
    UtilsCjs.setToSJISFunction(testToSJIS)

    expect(Regex.testNumeric('123')).toBe(true)
    expect(Regex.testNumeric('12A')).toBe(false)
    expect(Regex.testAlphanumeric('HELLO $')).toBe(true)
    expect(Regex.testAlphanumeric('hello')).toBe(false)
    expect(Regex.testKanji('漢字')).toBe(0x8e9a)
    expect(Regex.testKanji('A')).toBe(0)
    expect(Regex.isNumeric('123', 1)).toBe(true)
    expect(Regex.isAlphanumeric('A$', 1)).toBe(true)
    expect(Regex.isKanji('漢', 0)).toBe(true)

    expect(Mode.getCharCountIndicator(Mode.NUMERIC, 1)).toBe(10)
    expect(Mode.getCharCountIndicator(Mode.NUMERIC, 10)).toBe(12)
    expect(Mode.getCharCountIndicator(Mode.NUMERIC, 27)).toBe(14)
    expect(Mode.getBestModeForData('123')).toBe(Mode.NUMERIC)
    expect(Mode.getBestModeForData('HELLO $')).toBe(Mode.ALPHANUMERIC)
    expect(Mode.getBestModeForData('漢字')).toBe(Mode.KANJI)
    expect(Mode.from('numeric')).toBe(Mode.NUMERIC)
    expect(Mode.from('BYTE')).toBe(Mode.BYTE)
    expect(Mode.from('bad', Mode.BYTE)).toBe(Mode.BYTE)
  })

  it('keeps alignment, finder, and format information calculations stable', () => {
    expect(AlignmentPattern.getRowColCoords(7)).toEqual([6, 22, 38])
    expect(AlignmentPattern.getPositions(7)).toEqual([
      [6, 22],
      [22, 6],
      [22, 22],
      [22, 38],
      [38, 22],
      [38, 38],
    ])
    expect(FinderPattern.getPositions(1)).toEqual([
      [0, 0],
      [14, 0],
      [0, 14],
    ])
    expect(FormatInfo.getEncodedBits(ECLevel.L, 0)).toBe(30660)
    expect(FormatInfo.getEncodedBits(ECLevel.M, 0)).toBe(21522)
    expect(FormatInfo.getEncodedBits(ECLevel.Q, 3)).toBe(14854)
  })

  it('keeps error correction levels compatible', () => {
    expect(ECLevel.from('low')).toBe(ECLevel.L)
    expect(ECLevel.from('m')).toBe(ECLevel.M)
    expect(ECLevel.from('quartile')).toBe(ECLevel.Q)
    expect(ECLevel.from('high')).toBe(ECLevel.H)
    expect(ECLevel.from('unknown', ECLevel.M)).toBe(ECLevel.M)
    expect(ECLevel.isValid(ECLevel.H)).toBe(true)
    expect(ECLevel.isValid({ bit: 4 })).toBe(false)
    expect(ECCode.getBlocksCount(7, ECLevelCjs.M)).toBe(4)
    expect(ECCode.getTotalCodewordsCount(7, ECLevelCjs.M)).toBe(72)
  })

  it('keeps data segment classes and mode identities compatible', () => {
    UtilsCjs.setToSJISFunction(testToSJIS)

    const numeric = new NumericData('12345')
    const alphanumeric = new AlphanumericData('AB')
    const byte = new ByteData('hi')
    const kanji = new KanjiData('漢字')

    expect(NumericData.getBitsLength(7)).toBe(24)
    expect(new NumericData('1234567').getLength()).toBe(7)
    expect(alphanumeric.getBitsLength()).toBe(11)
    expect(byte.getBitsLength()).toBe(16)
    expect(kanji.getBitsLength()).toBe(26)
    expect(numeric.mode).toBe(ModeCjs.NUMERIC)
    expect(alphanumeric.mode).toBe(ModeCjs.ALPHANUMERIC)
    expect(byte.mode).toBe(ModeCjs.BYTE)
    expect(kanji.mode).toBe(ModeCjs.KANJI)
    expect(bitsFor(numeric)).toEqual({ length: 17, bytes: [30, 214, 128] })
    expect(bitsFor(alphanumeric)).toEqual({ length: 11, bytes: [57, 160] })
    expect(bitsFor(byte)).toEqual({ length: 16, bytes: [104, 105] })
    expect(bitsFor(kanji)).toEqual({ length: 26, bytes: [57, 250, 134, 128] })
  })

  it('keeps version calculations compatible', () => {
    expect(Version.from('7')).toBe(7)
    expect(Version.from('bad', 3)).toBe(3)
    expect(Version.getCapacity(1, ECLevelCjs.M, ModeCjs.BYTE)).toBe(14)
    expect(Version.getCapacity(7, ECLevelCjs.M, ModeCjs.MIXED)).toBe(992)
    expect(Version.getEncodedBits(7)).toBe(31892)
    expect(
      Version.getBestVersionForData(new ByteData('hello'), ECLevelCjs.M),
    ).toBe(1)
    expect(
      Version.getBestVersionForData(
        [new NumericData('12345'), new ByteData('hi')],
        ECLevelCjs.M,
      ),
    ).toBe(1)
  })

  it('keeps polynomial and reed-solomon math stable', () => {
    expect(
      Array.from(
        Polynomial.mul(new Uint8Array([1, 2]), new Uint8Array([3, 4])),
      ),
    ).toEqual([3, 2, 8])
    expect(Array.from(Polynomial.generateECPolynomial(3))).toEqual([
      1, 7, 14, 8,
    ])
    expect(
      Array.from(
        new ReedSolomonEncoder(7).encode(
          new Uint8Array([32, 91, 11, 120, 209]),
        ),
      ),
    ).toEqual([24, 195, 9, 245, 136, 70, 48])
    expect(() => new ReedSolomonEncoder().encode(new Uint8Array([1]))).toThrow(
      'Encoder not initialized',
    )
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

  it('keeps mask pattern penalties and mutation stable', () => {
    const matrix = new BitMatrix(2)
    matrix.set(0, 0, true)
    matrix.set(0, 1, true)
    matrix.set(1, 0, false)
    matrix.set(1, 1, false)

    expect(MaskPattern.isValid('3')).toBe(true)
    expect(MaskPattern.from('3')).toBe(3)
    expect(MaskPattern.isValid('')).toBe(false)
    expect(MaskPattern.getPenaltyN1(matrix)).toBe(0)
    expect(MaskPattern.getPenaltyN2(matrix)).toBe(0)
    expect(MaskPattern.getPenaltyN3(matrix)).toBe(0)
    expect(MaskPattern.getPenaltyN4(matrix)).toBe(0)

    MaskPattern.applyMask(MaskPattern.Patterns.PATTERN000, matrix)

    expect(Array.from(matrix.data)).toEqual([0, 1, 0, 1])
  })

  it('keeps CommonJS compatibility shims synchronous', () => {
    const GF = require('../src/vendor/node-qrcode/lib/core/galois-field.cjs')
    const ModeCjs = require('../src/vendor/node-qrcode/lib/core/mode.cjs')
    const RegexCjs = require('../src/vendor/node-qrcode/lib/core/regex.cjs')
    const ECCodeCjs = require('../src/vendor/node-qrcode/lib/core/error-correction-code.cjs')
    const PolynomialCjs = require('../src/vendor/node-qrcode/lib/core/polynomial.cjs')
    const ReedSolomonEncoderCjs = require('../src/vendor/node-qrcode/lib/core/reed-solomon-encoder.cjs')
    const MaskPatternCjs = require('../src/vendor/node-qrcode/lib/core/mask-pattern.cjs')
    const VersionCjs = require('../src/vendor/node-qrcode/lib/core/version.cjs')
    const VersionCheck = require('../src/vendor/node-qrcode/lib/core/version-check.cjs')
    const CjsBitBuffer = require('../src/vendor/node-qrcode/lib/core/bit-buffer.cjs')
    const CjsBitMatrix = require('../src/vendor/node-qrcode/lib/core/bit-matrix.cjs')
    const CjsNumericData = require('../src/vendor/node-qrcode/lib/core/numeric-data.cjs')
    const CjsAlphanumericData = require('../src/vendor/node-qrcode/lib/core/alphanumeric-data.cjs')
    const CjsByteData = require('../src/vendor/node-qrcode/lib/core/byte-data.cjs')
    const CjsKanjiData = require('../src/vendor/node-qrcode/lib/core/kanji-data.cjs')

    expect(GF.mul(7, 3)).toBe(9)
    expect(ModeCjs.from('numeric')).toBe(ModeCjs.NUMERIC)
    expect(RegexCjs.testNumeric('123')).toBe(true)
    expect(UtilsCjs.getSymbolSize(1)).toBe(21)
    expect(ECCodeCjs.getBlocksCount(7, ECLevelCjs.M)).toBe(4)
    expect(Array.from(PolynomialCjs.generateECPolynomial(3))).toEqual([
      1, 7, 14, 8,
    ])
    expect(new ReedSolomonEncoderCjs(1).degree).toBe(1)
    expect(MaskPatternCjs.from('3')).toBe(3)
    expect(VersionCjs.getEncodedBits(7)).toBe(31892)
    expect(VersionCheck.isValid(40)).toBe(true)
    expect(new CjsBitBuffer().getLengthInBits()).toBe(0)
    expect(new CjsBitMatrix(1).size).toBe(1)
    expect(new CjsNumericData('1').mode).toBe(ModeCjs.NUMERIC)
    expect(new CjsAlphanumericData('A').mode).toBe(ModeCjs.ALPHANUMERIC)
    expect(new CjsByteData('x').mode).toBe(ModeCjs.BYTE)
    expect(new CjsKanjiData('漢').mode).toBe(ModeCjs.KANJI)
  })
})
