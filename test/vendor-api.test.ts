import { readFileSync, rmSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

import * as Browser from '../src/vendor/node-qrcode/lib/browser.ts'
import canPromise from '../src/vendor/node-qrcode/lib/can-promise.ts'
import index from '../src/vendor/node-qrcode/lib/index.ts'
import * as Server from '../src/vendor/node-qrcode/lib/server.ts'

const require = createRequire(import.meta.url)

interface FakeCanvasContext {
  imageData?: { data: Uint8ClampedArray }
  clearRect(): void
  createImageData(width: number, height: number): { data: Uint8ClampedArray }
  putImageData(image: { data: Uint8ClampedArray }): void
}

interface FakeCanvas {
  width: number
  height: number
  style?: {
    width?: string
    height?: string
  }
  context: FakeCanvasContext
  getContext(type: '2d'): FakeCanvasContext
  toDataURL(type?: string, quality?: unknown): string
}

function createFakeCanvas(): FakeCanvas {
  const context: FakeCanvasContext = {
    clearRect() {},
    createImageData(width, height) {
      this.imageData = {
        data: new Uint8ClampedArray(width * height * 4),
      }
      return this.imageData
    },
    putImageData() {},
  }

  return {
    width: 0,
    height: 0,
    style: {},
    context,
    getContext() {
      return context
    },
    toDataURL(type, quality) {
      return `${type ?? 'image/png'}:${quality ?? 'default'}:${this.width}`
    },
  }
}

describe('migrated node-qrcode API modules', () => {
  it('keeps promise and server APIs compatible', async () => {
    const svg = (await Server.toString('server svg', { type: 'svg' })) as string
    const terminal = (await Server.toString('terminal', {
      type: 'terminal',
    })) as string
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      Server.toBuffer('buffer', { type: 'png' }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result as Buffer)
        }
      })
    })

    expect(svg).toContain('<svg')
    expect(terminal).toContain('\x1b[')
    expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  })

  it('keeps file output and browser canvas APIs compatible', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'qrcore-api-'))
    const svgPath = join(dir, 'qr.svg')
    const canvas = createFakeCanvas()

    try {
      await Server.toFile(svgPath, 'file svg', { type: 'svg' })
      const renderedCanvas = (await Browser.toCanvas(canvas, 'browser canvas', {
        margin: 0,
      })) as FakeCanvas
      const browserSvg = (await Browser.toString('browser svg')) as string

      expect(readFileSync(svgPath, 'utf8')).toContain('<svg')
      expect(renderedCanvas).toBe(canvas)
      expect(canvas.width).toBeGreaterThan(0)
      expect(browserSvg).toContain('<svg')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('keeps top-level CommonJS compatibility shims synchronous', async () => {
    const canPromiseCjs =
      require('../src/vendor/node-qrcode/lib/can-promise.cjs') as typeof canPromise
    const ServerCjs =
      require('../src/vendor/node-qrcode/lib/server.cjs') as typeof Server
    const BrowserCjs =
      require('../src/vendor/node-qrcode/lib/browser.cjs') as typeof Browser
    const IndexCjs =
      require('../src/vendor/node-qrcode/lib/index.cjs') as typeof index

    expect(canPromise()).toBe(true)
    expect(canPromiseCjs()).toBe(true)
    expect(IndexCjs.create).toBe(ServerCjs.create)
    expect(await ServerCjs.toString('cjs svg', { type: 'svg' })).toContain(
      '<svg',
    )
    expect(await BrowserCjs.toString('cjs browser svg')).toContain('<svg')
  })
})
