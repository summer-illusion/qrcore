import { createRequire } from 'node:module'

import type * as QRCodeModule from './core/qrcode.ts'
import type * as CanvasRendererModule from './renderer/canvas.ts'
import type * as SvgRendererModule from './renderer/svg-tag.ts'

const require = createRequire(import.meta.url)
const canPromise = require('./can-promise.cjs') as () => boolean
const QRCode = require('./core/qrcode.cjs') as typeof QRCodeModule
const CanvasRenderer = require(
  './renderer/canvas.cjs',
) as typeof CanvasRendererModule
const SvgRenderer = require('./renderer/svg-tag.cjs') as typeof SvgRendererModule

type QRInput = Parameters<typeof QRCode.create>[0]
type QRCodeData = ReturnType<typeof QRCode.create>
type QRCallback<T = unknown> = (error: Error | null, result?: T) => void
type BrowserRenderFunction = (
  data: QRCodeData,
  canvas?: unknown,
  opts?: unknown,
) => unknown

function hasCanvasContext(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { getContext?: unknown }).getContext === 'function'
  )
}

function renderCanvas(
  renderFunc: BrowserRenderFunction,
  canvas?: unknown,
  text?: unknown,
  opts?: unknown,
  cb?: QRCallback,
): Promise<unknown> | void {
  const args = Array.prototype.slice.call(arguments, 1) as unknown[]
  const argsNum = args.length
  const isLastArgCb = typeof args[argsNum - 1] === 'function'
  let canvasEl = canvas
  let inputText = text
  let renderOptions = opts
  let callback = cb

  if (!isLastArgCb && !canPromise()) {
    throw new Error('Callback required as last argument')
  }

  if (isLastArgCb) {
    if (argsNum < 2) {
      throw new Error('Too few arguments provided')
    }

    if (argsNum === 2) {
      callback = inputText as QRCallback
      inputText = canvasEl
      canvasEl = renderOptions = undefined
    } else if (argsNum === 3) {
      if (hasCanvasContext(canvasEl) && typeof callback === 'undefined') {
        callback = renderOptions as QRCallback
        renderOptions = undefined
      } else {
        callback = renderOptions as QRCallback
        renderOptions = inputText
        inputText = canvasEl
        canvasEl = undefined
      }
    }
  } else {
    if (argsNum < 1) {
      throw new Error('Too few arguments provided')
    }

    if (argsNum === 1) {
      inputText = canvasEl
      canvasEl = renderOptions = undefined
    } else if (argsNum === 2 && !hasCanvasContext(canvasEl)) {
      renderOptions = inputText
      inputText = canvasEl
      canvasEl = undefined
    }

    return new Promise((resolve, reject) => {
      try {
        const data = QRCode.create(
          inputText as QRInput,
          renderOptions as QRCodeModule.CreateOptions,
        )
        resolve(renderFunc(data, canvasEl, renderOptions))
      } catch (e) {
        reject(e)
      }
    })
  }

  try {
    const data = QRCode.create(
      inputText as QRInput,
      renderOptions as QRCodeModule.CreateOptions,
    )
    callback!(null, renderFunc(data, canvasEl, renderOptions))
  } catch (e) {
    callback!(e as Error)
  }
}

export const create = QRCode.create
export const toCanvas = renderCanvas.bind(
  null,
  CanvasRenderer.render as BrowserRenderFunction,
)
export const toDataURL = renderCanvas.bind(
  null,
  CanvasRenderer.renderToDataURL as BrowserRenderFunction,
)

export const toString = renderCanvas.bind(
  null,
  (data: QRCodeData, _canvas?: unknown, opts?: unknown) =>
    SvgRenderer.render(data, opts as Parameters<typeof SvgRenderer.render>[1]),
)

export default {
  create,
  toCanvas,
  toDataURL,
  toString,
}
