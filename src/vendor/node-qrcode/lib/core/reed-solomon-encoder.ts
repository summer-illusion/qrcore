import { generateECPolynomial, mod } from './polynomial.ts'

export default class ReedSolomonEncoder {
  degree: number | undefined
  genPoly: Uint8Array | undefined

  constructor(degree?: number) {
    this.degree = degree

    if (this.degree) this.initialize(this.degree)
  }

  initialize(degree: number): void {
    this.degree = degree
    this.genPoly = generateECPolynomial(this.degree)
  }

  encode(data: Uint8Array): Uint8Array {
    if (!this.genPoly) {
      throw new Error('Encoder not initialized')
    }

    const degree = this.degree ?? 0
    const paddedData = new Uint8Array(data.length + degree)
    paddedData.set(data)

    const remainder = mod(paddedData, this.genPoly)
    const start = degree - remainder.length

    if (start > 0) {
      const buffer = new Uint8Array(degree)
      buffer.set(remainder, start)

      return buffer
    }

    return remainder
  }
}
