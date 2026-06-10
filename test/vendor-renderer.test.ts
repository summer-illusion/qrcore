import { readFileSync, rmSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

import * as QRCodeCore from '../src/vendor/node-qrcode/lib/core/qrcode.ts'
import * as CanvasRenderer from '../src/vendor/node-qrcode/lib/renderer/canvas.ts'
import * as PngRenderer from '../src/vendor/node-qrcode/lib/renderer/png.ts'
import * as SvgRenderer from '../src/vendor/node-qrcode/lib/renderer/svg.ts'
import * as SvgTagRenderer from '../src/vendor/node-qrcode/lib/renderer/svg-tag.ts'
import * as TerminalRenderer from '../src/vendor/node-qrcode/lib/renderer/terminal.ts'
import * as TerminalSmallRenderer from '../src/vendor/node-qrcode/lib/renderer/terminal/terminal-small.ts'
import * as TerminalBigRenderer from '../src/vendor/node-qrcode/lib/renderer/terminal/terminal.ts'
import * as RendererUtils from '../src/vendor/node-qrcode/lib/renderer/utils.ts'
import * as Utf8Renderer from '../src/vendor/node-qrcode/lib/renderer/utf8.ts'

const require = createRequire(import.meta.url)

interface FakeCanvasContext {
  imageData?: { data: Uint8ClampedArray }
  clearRectCalls: number
  putImageDataCalls: number
  clearRect(x: number, y: number, width: number, height: number): void
  createImageData(width: number, height: number): { data: Uint8ClampedArray }
  putImageData(image: { data: Uint8ClampedArray }, x: number, y: number): void
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

function createFixtureQr() {
  return QRCodeCore.create('qrcore', { errorCorrectionLevel: 'M' })
}

function createFakeCanvas(): FakeCanvas {
  const context: FakeCanvasContext = {
    clearRectCalls: 0,
    putImageDataCalls: 0,
    clearRect() {
      this.clearRectCalls++
    },
    createImageData(width, height) {
      this.imageData = {
        data: new Uint8ClampedArray(width * height * 4),
      }
      return this.imageData
    },
    putImageData() {
      this.putImageDataCalls++
    },
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

describe('migrated node-qrcode renderer modules', () => {
  it('normalizes renderer options and converts QR pixels to image data', () => {
    const opts = RendererUtils.getOptions({
      margin: -1,
      scale: 2,
      color: {
        dark: '#123',
        light: '#abcd',
      },
    })
    const qr = createFixtureQr()
    const imgData = new Uint8ClampedArray(
      RendererUtils.getImageWidth(qr.modules.size, opts) ** 2 * 4,
    )

    RendererUtils.qrToImageData(imgData, qr, opts)

    expect(opts).toMatchObject({
      margin: 4,
      scale: 2,
      color: {
        dark: { r: 17, g: 34, b: 51, a: 255, hex: '#112233' },
        light: { r: 170, g: 187, b: 204, a: 221, hex: '#aabbcc' },
      },
    })
    expect(RendererUtils.getImageWidth(qr.modules.size, opts)).toBe(58)
    expect(Array.from(imgData.slice(0, 4))).toEqual([170, 187, 204, 221])
    expect(Math.max(...imgData)).toBe(255)
  })

  it('renders SVG tags with callback compatibility', () => {
    const qr = createFixtureQr()
    let callbackSvg = ''
    const svg = SvgTagRenderer.render(
      qr,
      {
        margin: 1,
        color: {
          dark: '#11223380',
          light: '#ffffff00',
        },
      },
      (error, result) => {
        expect(error).toBeNull()
        callbackSvg = result
      },
    )

    expect(callbackSvg).toBe(svg)
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('viewBox="0 0 23 23"')
    expect(svg).toContain('stroke="#112233" stroke-opacity=".50"')
    expect(svg).not.toContain('fill="#ffffff"')
  })

  it('renders SVG and UTF-8 file outputs', async () => {
    const qr = createFixtureQr()
    const dir = await mkdtemp(join(tmpdir(), 'qrcore-renderer-'))
    const svgPath = join(dir, 'qr.svg')
    const txtPath = join(dir, 'qr.txt')

    try {
      await new Promise<void>((resolve, reject) => {
        SvgRenderer.renderToFile(svgPath, qr, { margin: 0 }, (error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })

      await new Promise<void>((resolve, reject) => {
        Utf8Renderer.renderToFile(txtPath, qr, { margin: 0 }, (error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })

      expect(readFileSync(svgPath, 'utf8')).toContain(
        '<?xml version="1.0" encoding="utf-8"?>',
      )
      expect(readFileSync(txtPath, 'utf8')).toContain('█')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('renders PNG buffers and data URLs', async () => {
    const qr = createFixtureQr()
    const png = PngRenderer.render(qr, { margin: 0 })
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      PngRenderer.renderToBuffer(qr, { margin: 0 }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result!)
        }
      })
    })
    const dataUrl = await new Promise<string>((resolve, reject) => {
      PngRenderer.renderToDataURL(qr, { margin: 0 }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result!)
        }
      })
    })

    expect(png.width).toBe(84)
    expect(png.height).toBe(84)
    expect(Array.from(png.data.slice(0, 4))).toEqual([0, 0, 0, 255])
    expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('renders onto canvas-like targets', () => {
    const qr = createFixtureQr()
    const canvas = createFakeCanvas()
    const renderedCanvas = CanvasRenderer.render(qr, canvas, {
      margin: 0,
      rendererOpts: { quality: 0.8 },
    })
    const dataUrl = CanvasRenderer.renderToDataURL(qr, canvas, {
      margin: 0,
      rendererOpts: { quality: 0.8 },
    })

    expect(renderedCanvas).toBe(canvas)
    expect(canvas.width).toBe(84)
    expect(canvas.height).toBe(84)
    expect(canvas.style).toEqual({ width: '84px', height: '84px' })
    expect(canvas.context.clearRectCalls).toBe(2)
    expect(canvas.context.putImageDataCalls).toBe(2)
    expect(Array.from(canvas.context.imageData!.data.slice(0, 4))).toEqual([
      0, 0, 0, 255,
    ])
    expect(dataUrl).toBe('image/png:0.8:84')
  })

  it('renders terminal output variants', () => {
    const qr = createFixtureQr()
    let callbackTerminal = ''
    const big = TerminalBigRenderer.render(qr, undefined, (error, result) => {
      expect(error).toBeNull()
      callbackTerminal = result
    })
    const small = TerminalRenderer.render(qr, { small: true })
    const inverseSmall = TerminalSmallRenderer.render(qr, { inverse: true })

    expect(callbackTerminal).toBe(big)
    expect(big).toContain('\x1b[40m  \x1b[0m')
    expect(big).toContain('\x1b[47m  \x1b[0m')
    expect(small).toContain('▀')
    expect(inverseSmall.startsWith('\x1b[40m\x1b[37m')).toBe(true)
  })

  it('keeps renderer CommonJS compatibility shims synchronous', () => {
    const qr = createFixtureQr()
    const CanvasCjs =
      require('../src/vendor/node-qrcode/lib/renderer/canvas.cjs') as typeof CanvasRenderer
    const PngCjs =
      require('../src/vendor/node-qrcode/lib/renderer/png.cjs') as typeof PngRenderer
    const UtilsCjs =
      require('../src/vendor/node-qrcode/lib/renderer/utils.cjs') as typeof RendererUtils
    const SvgTagCjs =
      require('../src/vendor/node-qrcode/lib/renderer/svg-tag.cjs') as typeof SvgTagRenderer
    const SvgCjs =
      require('../src/vendor/node-qrcode/lib/renderer/svg.cjs') as typeof SvgRenderer
    const TerminalCjs =
      require('../src/vendor/node-qrcode/lib/renderer/terminal.cjs') as typeof TerminalRenderer
    const TerminalBigCjs =
      require('../src/vendor/node-qrcode/lib/renderer/terminal/terminal.cjs') as typeof TerminalBigRenderer
    const TerminalSmallCjs =
      require('../src/vendor/node-qrcode/lib/renderer/terminal/terminal-small.cjs') as typeof TerminalSmallRenderer
    const Utf8Cjs =
      require('../src/vendor/node-qrcode/lib/renderer/utf8.cjs') as typeof Utf8Renderer

    expect(UtilsCjs.getImageWidth(qr.modules.size, UtilsCjs.getOptions())).toBe(
      116,
    )
    expect(PngCjs.render(qr, { margin: 0 }).width).toBe(84)
    expect(CanvasCjs.render(qr, createFakeCanvas(), { margin: 0 }).width).toBe(
      84,
    )
    expect(SvgTagCjs.render(qr)).toBe(SvgTagRenderer.render(qr))
    expect(SvgCjs.render(qr)).toBe(SvgRenderer.render(qr))
    expect(TerminalCjs.render(qr, { small: true })).toBe(
      TerminalRenderer.render(qr, { small: true }),
    )
    expect(TerminalBigCjs.render(qr)).toBe(TerminalBigRenderer.render(qr))
    expect(TerminalSmallCjs.render(qr, { inverse: true })).toBe(
      TerminalSmallRenderer.render(qr, { inverse: true }),
    )
    expect(Utf8Cjs.render(qr, { margin: 0 })).toBe(
      Utf8Renderer.render(qr, { margin: 0 }),
    )
  })
})
