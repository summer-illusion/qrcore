import { createRequire } from 'node:module'

import type * as ModeModule from './mode.ts'

const require = createRequire(import.meta.url)
const Mode = require('./mode.cjs') as typeof ModeModule

interface BitBufferLike {
  put(num: number, length: number): void
}

export default class ByteData {
  mode = Mode.BYTE
  data: Uint8Array

  constructor(data: string | ArrayLike<number> | ArrayBufferLike) {
    if (typeof data === 'string') {
      this.data = new TextEncoder().encode(data)
    } else {
      this.data = new Uint8Array(data as ArrayBuffer | ArrayLike<number>)
    }
  }

  static getBitsLength(length: number): number {
    return length * 8
  }

  getLength(): number {
    return this.data.length
  }

  getBitsLength(): number {
    return ByteData.getBitsLength(this.data.length)
  }

  write(bitBuffer: BitBufferLike): void {
    for (let i = 0, l = this.data.length; i < l; i++) {
      bitBuffer.put(this.data[i], 8)
    }
  }
}
