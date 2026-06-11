import { createRequire } from 'node:module'

import { afterEach, describe, expect, it } from 'vitest'

import toSJIS from '../src/vendor/node-qrcode/helper/to-sjis.ts'

const require = createRequire(import.meta.url)

describe('migrated node-qrcode helpers', () => {
  afterEach(() => {
    delete (globalThis as { QRCode?: unknown }).QRCode
  })

  it('keeps SJIS lookup behavior compatible', () => {
    const toSJISCjs =
      require('../src/vendor/node-qrcode/helper/to-sjis.cjs') as typeof toSJIS

    expect(toSJIS('漢')).toBe(0x8abf)
    expect(toSJIS('字')).toBe(0x8e9a)
    expect(toSJIS('A')).toBeUndefined()
    expect(toSJISCjs('漢')).toBe(0x8abf)
  })

  it('attaches the browser helper to the QRCode global', () => {
    ;(globalThis as { QRCode?: { toSJIS?: typeof toSJIS } }).QRCode = {}

    const browserToSJIS =
      require('../src/vendor/node-qrcode/helper/to-sjis-browser.cjs') as typeof toSJIS

    expect(browserToSJIS('漢')).toBe(0x8abf)
    expect(
      (
        globalThis as unknown as { QRCode: { toSJIS: typeof toSJIS } }
      ).QRCode.toSJIS('字'),
    ).toBe(0x8e9a)
  })
})
