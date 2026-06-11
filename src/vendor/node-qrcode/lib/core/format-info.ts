import { getBCHDigit } from './utils.ts'

interface ErrorCorrectionLevel {
  bit: number
}

const G15 =
  (1 << 10) |
  (1 << 8) |
  (1 << 5) |
  (1 << 4) |
  (1 << 2) |
  (1 << 1) |
  (1 << 0)
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1)
const G15_BCH = getBCHDigit(G15)

export function getEncodedBits(
  errorCorrectionLevel: ErrorCorrectionLevel,
  mask: number,
): number {
  const data = (errorCorrectionLevel.bit << 3) | mask
  let d = data << 10

  while (getBCHDigit(d) - G15_BCH >= 0) {
    d ^= G15 << (getBCHDigit(d) - G15_BCH)
  }

  return ((data << 10) | d) ^ G15_MASK
}

export default {
  getEncodedBits,
}
