import { createRequire } from 'node:module'

import jsQR from 'jsqr'
import { describe, expect, it } from 'vitest'

import { toBuffer, toDataURL } from '../src/index.js'

const require = createRequire(import.meta.url)
const PNG = (
  require('pngjs') as {
    PNG: {
      sync: {
        read(buffer: Buffer): {
          width: number
          height: number
          data: Uint8Array
        }
      }
    }
  }
).PNG

function decodePng(buffer: Buffer): string | null {
  const image = PNG.sync.read(buffer)
  const rgba = new Uint8ClampedArray(
    image.data.buffer,
    image.data.byteOffset,
    image.data.byteLength,
  )
  const result = jsQR(rgba, image.width, image.height, {
    inversionAttempts: 'dontInvert',
  })

  return result?.data ?? null
}

describe('QR round-trip decoding', () => {
  it('generates PNG output that scans back to the original payload', async () => {
    const payload = 'qrcore roundtrip 12345'
    const buffer = await toBuffer(payload, {
      type: 'png',
      scale: 8,
      margin: 4,
      errorCorrectionLevel: 'M',
    })

    expect(decodePng(buffer)).toBe(payload)
  })

  it('generates PNG data URLs that scan back to the original payload', async () => {
    const payload = 'qrcore data-url roundtrip'
    const dataUrl = await toDataURL(payload, {
      type: 'image/png',
      scale: 8,
      margin: 4,
      errorCorrectionLevel: 'Q',
    })
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')

    expect(decodePng(Buffer.from(base64, 'base64'))).toBe(payload)
  })
})
