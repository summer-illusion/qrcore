import { createRequire } from 'node:module'

import type * as UtilsModule from './utils.ts'

const require = createRequire(import.meta.url)
const fs = require('node:fs') as typeof import('node:fs')
const PNG = (
  require('pngjs') as {
    PNG: new (opts: Record<string, unknown>) => PngImage
  }
).PNG
const Utils = require('./utils.cjs') as typeof UtilsModule

interface PngImage {
  width: number
  height: number
  data: Uint8Array
  on(event: 'error', cb: RenderCallback<never>): this
  on(event: 'data', cb: (data: Uint8Array) => void): this
  on(event: 'end', cb: () => void): this
  pack(): NodeJS.ReadableStream
}

type RenderCallback<T> = (error: Error | null, result?: T) => void
type RenderToFileCallback = (...args: unknown[]) => void

export function render(
  qrData: UtilsModule.QRCodeRenderable,
  options?: UtilsModule.RendererOptionsInput,
): PngImage {
  const opts = Utils.getOptions(options)
  const pngOpts = opts.rendererOpts
  const size = Utils.getImageWidth(qrData.modules.size, opts)

  pngOpts.width = size
  pngOpts.height = size

  const pngImage = new PNG(pngOpts)
  Utils.qrToImageData(pngImage.data, qrData, opts)

  return pngImage
}

export function renderToDataURL(
  qrData: UtilsModule.QRCodeRenderable,
  options?: UtilsModule.RendererOptionsInput | RenderCallback<string>,
  cb?: RenderCallback<string>,
): void {
  let resolvedOptions = options as UtilsModule.RendererOptionsInput | undefined
  let callback = cb

  if (typeof callback === 'undefined') {
    callback = options as RenderCallback<string>
    resolvedOptions = undefined
  }

  renderToBuffer(qrData, resolvedOptions, (err, output) => {
    if (err) callback(err)
    let url = 'data:image/png;base64,'
    url += output?.toString('base64')
    callback(null, url)
  })
}

export function renderToBuffer(
  qrData: UtilsModule.QRCodeRenderable,
  options?: UtilsModule.RendererOptionsInput | RenderCallback<Buffer>,
  cb?: RenderCallback<Buffer>,
): void {
  let resolvedOptions = options as UtilsModule.RendererOptionsInput | undefined
  let callback = cb

  if (typeof callback === 'undefined') {
    callback = options as RenderCallback<Buffer>
    resolvedOptions = undefined
  }

  const png = render(qrData, resolvedOptions)
  const buffer: Uint8Array[] = []

  png.on('error', callback)

  png.on('data', (data) => {
    buffer.push(data)
  })

  png.on('end', () => {
    callback(null, Buffer.concat(buffer))
  })

  png.pack()
}

export function renderToFile(
  path: string,
  qrData: UtilsModule.QRCodeRenderable,
  options?: UtilsModule.RendererOptionsInput | RenderToFileCallback,
  cb?: RenderToFileCallback,
): void {
  let resolvedOptions = options as UtilsModule.RendererOptionsInput | undefined
  let callback = cb

  if (typeof callback === 'undefined') {
    callback = options as RenderToFileCallback
    resolvedOptions = undefined
  }

  let called = false
  const done = (...args: unknown[]) => {
    if (called) return
    called = true
    callback.apply(null, args)
  }
  const stream = fs.createWriteStream(path)

  stream.on('error', done)
  stream.on('close', done)

  renderToFileStream(stream, qrData, resolvedOptions)
}

export function renderToFileStream(
  stream: NodeJS.WritableStream,
  qrData: UtilsModule.QRCodeRenderable,
  options?: UtilsModule.RendererOptionsInput,
): void {
  const png = render(qrData, options)
  png.pack().pipe(stream)
}

export default {
  render,
  renderToDataURL,
  renderToBuffer,
  renderToFile,
  renderToFileStream,
}
