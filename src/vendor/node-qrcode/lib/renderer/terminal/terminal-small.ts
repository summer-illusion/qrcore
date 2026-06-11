import type * as UtilsModule from '../utils.ts'

interface TerminalSmallOptions extends UtilsModule.RendererOptionsInput {
  inverse?: boolean
}

type PixelCode = '0' | '1' | '2'
type PaletteKey = `${PixelCode}${PixelCode}`
type Palette = Record<PaletteKey, string>
type RenderCallback = (error: Error | null, result: string) => void

const backgroundWhite = '\x1b[47m'
const backgroundBlack = '\x1b[40m'
const foregroundWhite = '\x1b[37m'
const foregroundBlack = '\x1b[30m'
const reset = '\x1b[0m'
const lineSetupNormal = backgroundWhite + foregroundBlack
const lineSetupInverse = backgroundBlack + foregroundWhite

function createPalette(
  lineSetup: string,
  whiteForeground: string,
  blackForeground: string,
): Palette {
  return {
    '00': reset + ' ' + lineSetup,
    '01': reset + whiteForeground + '▄' + lineSetup,
    '02': reset + blackForeground + '▄' + lineSetup,
    10: reset + whiteForeground + '▀' + lineSetup,
    11: ' ',
    12: '▄',
    20: reset + blackForeground + '▀' + lineSetup,
    21: '▀',
    22: '█',
  }
}

function mkCodePixel(
  modules: ArrayLike<boolean | number>,
  size: number,
  x: number,
  y: number,
): PixelCode {
  const sizePlus = size + 1
  if (x >= sizePlus || y >= sizePlus || y < -1 || x < -1) return '0'
  if (x >= size || y >= size || y < 0 || x < 0) return '1'
  const idx = y * size + x
  return modules[idx] ? '2' : '1'
}

function mkCode(
  modules: ArrayLike<boolean | number>,
  size: number,
  x: number,
  y: number,
): PaletteKey {
  return (
    mkCodePixel(modules, size, x, y) + mkCodePixel(modules, size, x, y + 1)
  ) as PaletteKey
}

export function render(
  qrData: UtilsModule.QRCodeRenderable,
  options?: TerminalSmallOptions,
  cb?: RenderCallback,
): string {
  const size = qrData.modules.size
  const data = qrData.modules.data

  const inverse = !!(options && options.inverse)
  const lineSetup = inverse ? lineSetupInverse : lineSetupNormal
  const white = inverse ? foregroundBlack : foregroundWhite
  const black = inverse ? foregroundWhite : foregroundBlack

  const palette = createPalette(lineSetup, white, black)
  const newLine = reset + '\n' + lineSetup

  let output = lineSetup

  for (let y = -1; y < size + 1; y += 2) {
    for (let x = -1; x < size; x++) {
      output += palette[mkCode(data, size, x, y)]
    }

    output += palette[mkCode(data, size, size, y)] + newLine
  }

  output += reset

  if (typeof cb === 'function') {
    cb(null, output)
  }

  return output
}

export default {
  render,
}
