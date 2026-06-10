import { createRequire } from 'node:module'

import type * as SvgTagRendererModule from './svg-tag.ts'
import type * as UtilsModule from './utils.ts'

const require = createRequire(import.meta.url)
const svgTagRenderer = require('./svg-tag.cjs') as typeof SvgTagRendererModule

type RenderToFileCallback = (error?: NodeJS.ErrnoException | null) => void

export const render = svgTagRenderer.render

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

  const fs = require('node:fs') as typeof import('node:fs')
  const svgTag = render(qrData, resolvedOptions)

  const xmlStr =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
    svgTag

  fs.writeFile(
    path,
    xmlStr,
    callback as (err: NodeJS.ErrnoException | null) => void,
  )
}

export default {
  render,
  renderToFile,
}
