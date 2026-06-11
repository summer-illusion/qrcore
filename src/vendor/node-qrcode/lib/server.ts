import { createRequire } from 'node:module'

import type * as BrowserModule from './browser.ts'
import type * as QRCodeModule from './core/qrcode.ts'
import type * as PngRendererModule from './renderer/png.ts'
import type * as SvgRendererModule from './renderer/svg.ts'
import type * as TerminalRendererModule from './renderer/terminal.ts'
import type * as Utf8RendererModule from './renderer/utf8.ts'

const require = createRequire(import.meta.url)
const canPromise = require('./can-promise.cjs') as () => boolean
const QRCode = require('./core/qrcode.cjs') as typeof QRCodeModule
const PngRenderer = require('./renderer/png.cjs') as typeof PngRendererModule
const Utf8Renderer = require('./renderer/utf8.cjs') as typeof Utf8RendererModule
const TerminalRenderer = require(
  './renderer/terminal.cjs',
) as typeof TerminalRendererModule
const SvgRenderer = require('./renderer/svg.cjs') as typeof SvgRendererModule

type QRInput = Parameters<typeof QRCode.create>[0]
type QRCodeData = ReturnType<typeof QRCode.create>
type QRCallback = (error: Error | null, result?: unknown) => void
type RenderOptions = QRCodeModule.CreateOptions &
  Record<string, unknown> & {
    type?: string
  }
type RenderFunction = (
  data: QRCodeData,
  opts: RenderOptions,
  cb: QRCallback,
) => unknown
type RendererModule = Record<string, RenderFunction>

interface RenderParams {
  opts: RenderOptions
  cb: QRCallback | null
}

function checkParams(
  text: unknown,
  opts?: RenderOptions | QRCallback,
  cb?: QRCallback,
): RenderParams {
  if (typeof text === 'undefined') {
    throw new Error('String required as first argument')
  }

  let resolvedOpts = opts as RenderOptions | undefined
  let callback: QRCallback | null | undefined = cb

  if (typeof callback === 'undefined') {
    callback = opts as QRCallback
    resolvedOpts = {}
  }

  if (typeof callback !== 'function') {
    if (!canPromise()) {
      throw new Error('Callback required as last argument')
    } else {
      resolvedOpts = (callback || {}) as RenderOptions
      callback = null
    }
  }

  return {
    opts: resolvedOpts ?? {},
    cb: callback ?? null,
  }
}

function getTypeFromFilename(path: string): string {
  return path.slice(((path.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
}

function getRendererFromType(type?: string): RendererModule {
  switch (type) {
    case 'svg':
      return SvgRenderer as unknown as RendererModule

    case 'txt':
    case 'utf8':
      return Utf8Renderer as unknown as RendererModule

    case 'png':
    case 'image/png':
    default:
      return PngRenderer as unknown as RendererModule
  }
}

function getStringRendererFromType(type?: string): RendererModule {
  switch (type) {
    case 'svg':
      return SvgRenderer as unknown as RendererModule

    case 'terminal':
      return TerminalRenderer as unknown as RendererModule

    case 'utf8':
    default:
      return Utf8Renderer as unknown as RendererModule
  }
}

function render(
  renderFunc: RenderFunction,
  text: QRInput,
  params: RenderParams,
): Promise<unknown> | unknown {
  if (!params.cb) {
    return new Promise((resolve, reject) => {
      try {
        const data = QRCode.create(text, params.opts)
        return renderFunc(data, params.opts, (err, data) => {
          return err ? reject(err) : resolve(data)
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  try {
    const data = QRCode.create(text, params.opts)
    return renderFunc(data, params.opts, params.cb)
  } catch (e) {
    params.cb(e as Error)
  }
}

export const create = QRCode.create

export const toCanvas = (require('./browser.cjs') as typeof BrowserModule)
  .toCanvas

export function toString(
  text: QRInput,
  opts?: RenderOptions | QRCallback,
  cb?: QRCallback,
): Promise<unknown> | unknown {
  const params = checkParams(text, opts, cb)
  const type = params.opts ? params.opts.type : undefined
  const renderer = getStringRendererFromType(type)
  return render(renderer.render, text, params)
}

export function toDataURL(
  text: QRInput,
  opts?: RenderOptions | QRCallback,
  cb?: QRCallback,
): Promise<unknown> | unknown {
  const params = checkParams(text, opts, cb)
  const renderer = getRendererFromType(params.opts.type)
  return render(renderer.renderToDataURL, text, params)
}

export function toBuffer(
  text: QRInput,
  opts?: RenderOptions | QRCallback,
  cb?: QRCallback,
): Promise<unknown> | unknown {
  const params = checkParams(text, opts, cb)
  const renderer = getRendererFromType(params.opts.type)
  return render(renderer.renderToBuffer, text, params)
}

export function toFile(
  path: string,
  text: QRInput,
  opts?: RenderOptions | QRCallback,
  cb?: QRCallback,
): Promise<unknown> | unknown {
  if (
    typeof path !== 'string' ||
    !(typeof text === 'string' || typeof text === 'object')
  ) {
    throw new Error('Invalid argument')
  }

  if (arguments.length < 3 && !canPromise()) {
    throw new Error('Too few arguments provided')
  }

  const params = checkParams(text, opts, cb)
  const type = params.opts.type || getTypeFromFilename(path)
  const renderer = getRendererFromType(type)
  const renderToFile = (
    renderer.renderToFile as unknown as (...args: unknown[]) => unknown
  ).bind(null, path) as RenderFunction

  return render(renderToFile, text, params)
}

export function toFileStream(
  stream: NodeJS.WritableStream,
  text: QRInput,
  opts?: RenderOptions,
): void {
  if (arguments.length < 2) {
    throw new Error('Too few arguments provided')
  }

  const params = checkParams(text, opts, stream.emit.bind(stream, 'error'))
  const renderer = getRendererFromType('png')
  const renderToFileStream = (
    renderer.renderToFileStream as unknown as (...args: unknown[]) => unknown
  ).bind(
    null,
    stream,
  ) as RenderFunction
  render(renderToFileStream, text, params)
}

export default {
  create,
  toCanvas,
  toString,
  toDataURL,
  toBuffer,
  toFile,
  toFileStream,
}
