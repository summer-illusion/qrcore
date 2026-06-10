import { createRequire } from 'node:module'

import type * as ECCodeModule from './error-correction-code.ts'
import type * as ECLevelModule from './error-correction-level.ts'
import type * as ModeModule from './mode.ts'
import type * as UtilsModule from './utils.ts'
import type * as VersionCheckModule from './version-check.ts'

const require = createRequire(import.meta.url)
const Utils = require('./utils.cjs') as typeof UtilsModule
const ECCode = require('./error-correction-code.cjs') as typeof ECCodeModule
const ECLevel = require('./error-correction-level.cjs') as typeof ECLevelModule
const Mode = require('./mode.cjs') as typeof ModeModule
const VersionCheck = require('./version-check.cjs') as typeof VersionCheckModule

interface SegmentLike {
  mode: ModeModule.Mode
  getLength(): number
  getBitsLength(): number
}

const G18 =
  (1 << 12) |
  (1 << 11) |
  (1 << 10) |
  (1 << 9) |
  (1 << 8) |
  (1 << 5) |
  (1 << 2) |
  (1 << 0)
const G18_BCH = Utils.getBCHDigit(G18)

function getBestVersionForDataLength(
  mode: ModeModule.Mode,
  length: number,
  errorCorrectionLevel: ECLevelModule.ErrorCorrectionLevel,
): number | undefined {
  for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
    if (length <= getCapacity(currentVersion, errorCorrectionLevel, mode)) {
      return currentVersion
    }
  }

  return undefined
}

function getReservedBitsCount(mode: ModeModule.Mode, version: number): number {
  return Mode.getCharCountIndicator(mode, version) + 4
}

function getTotalBitsFromDataArray(
  segments: SegmentLike[],
  version: number,
): number {
  let totalBits = 0

  segments.forEach((data) => {
    const reservedBits = getReservedBitsCount(data.mode, version)
    totalBits += reservedBits + data.getBitsLength()
  })

  return totalBits
}

function getBestVersionForMixedData(
  segments: SegmentLike[],
  errorCorrectionLevel: ECLevelModule.ErrorCorrectionLevel,
): number | undefined {
  for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
    const length = getTotalBitsFromDataArray(segments, currentVersion)
    if (length <= getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
      return currentVersion
    }
  }

  return undefined
}

export function from(
  value: number | string,
  defaultValue?: number,
): number | undefined {
  if (VersionCheck.isValid(value)) {
    return parseInt(String(value), 10)
  }

  return defaultValue
}

export function getCapacity(
  version: number,
  errorCorrectionLevel: ECLevelModule.ErrorCorrectionLevel,
  mode: ModeModule.Mode = Mode.BYTE,
): number {
  if (!VersionCheck.isValid(version)) {
    throw new Error('Invalid QR Code version')
  }

  const totalCodewords = Utils.getSymbolTotalCodewords(version) ?? 0
  const ecTotalCodewords =
    ECCode.getTotalCodewordsCount(version, errorCorrectionLevel) ?? 0

  const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8

  if (mode === Mode.MIXED) return dataTotalCodewordsBits

  const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version)

  switch (mode) {
    case Mode.NUMERIC:
      return Math.floor((usableBits / 10) * 3)
    case Mode.ALPHANUMERIC:
      return Math.floor((usableBits / 11) * 2)
    case Mode.KANJI:
      return Math.floor(usableBits / 13)
    case Mode.BYTE:
    default:
      return Math.floor(usableBits / 8)
  }
}

export function getBestVersionForData(
  data: SegmentLike | SegmentLike[],
  errorCorrectionLevel?: ECLevelModule.ErrorCorrectionLevel,
): number | undefined {
  let seg: SegmentLike

  const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M)

  if (Array.isArray(data)) {
    if (data.length > 1) {
      return getBestVersionForMixedData(data, ecl!)
    }

    if (data.length === 0) {
      return 1
    }

    seg = data[0]
  } else {
    seg = data
  }

  return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl!)
}

export function getEncodedBits(version: number): number {
  if (!VersionCheck.isValid(version) || version < 7) {
    throw new Error('Invalid QR Code version')
  }

  let d = version << 12

  while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
    d ^= G18 << (Utils.getBCHDigit(d) - G18_BCH)
  }

  return (version << 12) | d
}

export default {
  from,
  getBestVersionForData,
  getCapacity,
  getEncodedBits,
}
