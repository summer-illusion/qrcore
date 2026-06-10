import { createRequire } from 'node:module'

import type * as ModeModule from './mode.ts'
import type * as UtilsModule from './utils.ts'

const require = createRequire(import.meta.url)
const Mode = require('./mode.cjs') as typeof ModeModule
const Utils = require('./utils.cjs') as typeof UtilsModule

interface BitBufferLike {
  put(num: number, length: number): void
}

export default class KanjiData {
  mode = Mode.KANJI
  data: string

  constructor(data: string) {
    this.data = data
  }

  static getBitsLength(length: number): number {
    return length * 13
  }

  getLength(): number {
    return this.data.length
  }

  getBitsLength(): number {
    return KanjiData.getBitsLength(this.data.length)
  }

  write(bitBuffer: BitBufferLike): void {
    for (let i = 0; i < this.data.length; i++) {
      let value = Utils.toSJIS(this.data[i])

      if (value >= 0x8140 && value <= 0x9ffc) {
        value -= 0x8140
      } else if (value >= 0xe040 && value <= 0xebbf) {
        value -= 0xc140
      } else {
        throw new Error(
          'Invalid SJIS character: ' +
            this.data[i] +
            '\n' +
            'Make sure your charset is UTF-8',
        )
      }

      value = (((value >>> 8) & 0xff) * 0xc0) + (value & 0xff)

      bitBuffer.put(value, 13)
    }
  }
}
