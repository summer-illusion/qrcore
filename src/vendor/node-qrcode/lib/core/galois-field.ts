const EXP_TABLE = new Uint8Array(512)
const LOG_TABLE = new Uint8Array(256)

/**
 * Precompute the log and anti-log tables for faster computation later.
 *
 * For each possible value in the galois field 2^8, precompute the logarithm
 * and anti-logarithm of this value.
 *
 * ref {@link https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders#Introduction_to_mathematical_fields}
 */
function initTables() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x
    LOG_TABLE[x] = i

    x <<= 1

    // The QR code specification uses byte-wise modulo 100011101 arithmetic.
    if (x & 0x100) {
      x ^= 0x11d
    }
  }

  // Double the anti-log table so multiplication does not need modulo 255.
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255]
  }
}

initTables()

export function log(n: number): number {
  if (n < 1) throw new Error('log(' + n + ')')
  return LOG_TABLE[n]
}

export function exp(n: number): number {
  return EXP_TABLE[n]
}

export function mul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]]
}

export default {
  exp,
  log,
  mul,
}
