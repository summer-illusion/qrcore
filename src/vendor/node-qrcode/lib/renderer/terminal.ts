import { createRequire } from 'node:module'

import type * as BigTerminalModule from './terminal/terminal.ts'
import type * as SmallTerminalModule from './terminal/terminal-small.ts'
import type * as UtilsModule from './utils.ts'

const require = createRequire(import.meta.url)
const big = require('./terminal/terminal.cjs') as typeof BigTerminalModule
const small = require(
  './terminal/terminal-small.cjs',
) as typeof SmallTerminalModule

interface TerminalOptions extends UtilsModule.RendererOptionsInput {
  small?: boolean
  inverse?: boolean
}

type RenderCallback = (error: Error | null, result: string) => void

export function render(
  qrData: UtilsModule.QRCodeRenderable,
  options?: TerminalOptions,
  cb?: RenderCallback,
): string {
  if (options && options.small) {
    return small.render(qrData, options, cb)
  }
  return big.render(qrData, options, cb)
}

export default {
  render,
}
