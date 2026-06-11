import { exp, mul as galoisFieldMul } from './galois-field.ts'

export function mul(p1: Uint8Array, p2: Uint8Array): Uint8Array {
  const coeff = new Uint8Array(p1.length + p2.length - 1)

  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      coeff[i + j] ^= galoisFieldMul(p1[i], p2[j])
    }
  }

  return coeff
}

export function mod(dividend: Uint8Array, divisor: Uint8Array): Uint8Array {
  let result = new Uint8Array(dividend)

  while (result.length - divisor.length >= 0) {
    const coeff = result[0]

    for (let i = 0; i < divisor.length; i++) {
      result[i] ^= galoisFieldMul(divisor[i], coeff)
    }

    let offset = 0
    while (offset < result.length && result[offset] === 0) offset++
    result = Uint8Array.from(result.subarray(offset))
  }

  return result
}

export function generateECPolynomial(degree: number): Uint8Array {
  let poly: Uint8Array<ArrayBufferLike> = new Uint8Array([1])
  for (let i = 0; i < degree; i++) {
    poly = mul(poly, new Uint8Array([1, exp(i)]))
  }

  return poly
}

export default {
  generateECPolynomial,
  mod,
  mul,
}
