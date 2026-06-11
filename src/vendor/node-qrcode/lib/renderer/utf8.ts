import { createRequire } from 'node:module'

import type * as UtilsModule from './utils.ts'

const require = createRequire(import.meta.url)
const Utils = require('./utils.cjs') as typeof UtilsModule

interface BlockChars {
  WW: string
  WB: string
  BB: string
  BW: string
}

type RenderCallback = (error: Error | null, result: string) => void
type RenderToFileCallback = (error?: NodeJS.ErrnoException | null) => void

const BLOCK_CHAR: BlockChars = {
  WW: ' ',
  WB: '▄',
  BB: '█',
  BW: '▀',
}

const INVERTED_BLOCK_CHAR: BlockChars = {
  BB: ' ',
  BW: '▄',
  WW: '█',
  WB: '▀',
}

function getBlockChar(
  top: boolean | number | undefined,
  bottom: boolean | number | undefined,
  blocks: BlockChars,
): string {
  if (top && bottom) return blocks.BB
  if (top && !bottom) return blocks.BW
  if (!top && bottom) return blocks.WB
  return blocks.WW
}

export function render(
  qrData: UtilsModule.QRCodeRenderable,
  options?: UtilsModule.RendererOptionsInput,
  cb?: RenderCallback,
): string {
  const opts = Utils.getOptions(options)
  let blocks = BLOCK_CHAR
  if (opts.color.dark.hex === '#ffffff' || opts.color.light.hex === '#000000') {
    blocks = INVERTED_BLOCK_CHAR
  }

  const size = qrData.modules.size
  const data = qrData.modules.data

  let output = ''
  let hMargin = Array(size + opts.margin * 2 + 1).join(blocks.WW)
  hMargin = Array(opts.margin / 2 + 1).join(hMargin + '\n')

  const vMargin = Array(opts.margin + 1).join(blocks.WW)

  output += hMargin
  for (let i = 0; i < size; i += 2) {
    output += vMargin
    for (let j = 0; j < size; j++) {
      const topModule = data[i * size + j]
      const bottomModule = data[(i + 1) * size + j]

      output += getBlockChar(topModule, bottomModule, blocks)
    }

    output += vMargin + '\n'
  }

  output += hMargin.slice(0, -1)

  if (typeof cb === 'function') {
    cb(null, output)
  }

  return output
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

  const fs = require('node:fs') as typeof import('node:fs')
  const utf8 = render(qrData, resolvedOptions)
  fs.writeFile(
    path,
    utf8,
    callback as (err: NodeJS.ErrnoException | null) => void,
  )
}

export default {
  render,
  renderToFile,
}
