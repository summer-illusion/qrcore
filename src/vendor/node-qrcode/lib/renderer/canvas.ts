import { createRequire } from 'node:module'

import type * as UtilsModule from './utils.ts'

const require = createRequire(import.meta.url)
const Utils = require('./utils.cjs') as typeof UtilsModule

interface CanvasContextLike {
  clearRect(x: number, y: number, width: number, height: number): void
  createImageData(width: number, height: number): { data: Uint8ClampedArray }
  putImageData(image: { data: Uint8ClampedArray }, x: number, y: number): void
}

interface CanvasLike {
  width: number
  height: number
  style?: {
    height?: string
    width?: string
  }
  getContext(type: '2d'): CanvasContextLike
  toDataURL(type?: string, quality?: unknown): string
}

interface CanvasRenderOptions extends UtilsModule.RendererOptionsInput {
  rendererOpts?: {
    quality?: unknown
  } & Record<string, unknown>
}

function hasCanvasContext(value: unknown): value is CanvasLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { getContext?: unknown }).getContext === 'function'
  )
}

function clearCanvas(
  ctx: CanvasContextLike,
  canvas: CanvasLike,
  size: number,
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!canvas.style) canvas.style = {}
  canvas.height = size
  canvas.width = size
  canvas.style.height = size + 'px'
  canvas.style.width = size + 'px'
}

function getCanvasElement(): CanvasLike {
  try {
    return document.createElement('canvas') as unknown as CanvasLike
  } catch {
    throw new Error('You need to specify a canvas element')
  }
}

export function render(
  qrData: UtilsModule.QRCodeRenderable,
  canvas?: CanvasLike | CanvasRenderOptions,
  options?: CanvasRenderOptions,
): CanvasLike {
  let opts = options
  let canvasEl = canvas as CanvasLike | undefined

  if (typeof opts === 'undefined' && !hasCanvasContext(canvasEl)) {
    opts = canvas as CanvasRenderOptions
    canvasEl = undefined
  }

  if (!canvasEl) {
    canvasEl = getCanvasElement()
  }

  const renderOpts = Utils.getOptions(opts)
  const size = Utils.getImageWidth(qrData.modules.size, renderOpts)

  const ctx = canvasEl.getContext('2d')
  const image = ctx.createImageData(size, size)
  Utils.qrToImageData(image.data, qrData, renderOpts)

  clearCanvas(ctx, canvasEl, size)
  ctx.putImageData(image, 0, 0)

  return canvasEl
}

export function renderToDataURL(
  qrData: UtilsModule.QRCodeRenderable,
  canvas?: CanvasLike | CanvasRenderOptions,
  options?: CanvasRenderOptions,
): string {
  let opts = options
  let canvasEl = canvas as CanvasLike | undefined

  if (typeof opts === 'undefined' && !hasCanvasContext(canvasEl)) {
    opts = canvas as CanvasRenderOptions
    canvasEl = undefined
  }

  if (!opts) opts = {}

  const renderedCanvas = render(qrData, canvasEl, opts)

  const type = opts.type || 'image/png'
  const rendererOpts = opts.rendererOpts || {}

  return renderedCanvas.toDataURL(
    type as string,
    rendererOpts.quality as number | undefined,
  )
}

export default {
  render,
  renderToDataURL,
}
