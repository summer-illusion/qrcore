export interface RendererColor {
  r: number
  g: number
  b: number
  a: number
  hex: string
}

export interface RendererColorOptions {
  dark?: string | number
  light?: string | number
}

export interface RendererOptionsInput {
  width?: number
  scale?: number
  margin?: number | null
  type?: unknown
  color?: RendererColorOptions
  rendererOpts?: Record<string, unknown>
}

export interface RendererOptions {
  width?: number
  scale: number
  margin: number
  type?: unknown
  color: {
    dark: RendererColor
    light: RendererColor
  }
  rendererOpts: Record<string, unknown>
}

export interface QRCodeRenderable {
  modules: {
    size: number
    data: ArrayLike<boolean | number>
  }
}

type ImageDataLike = Uint8Array | Uint8ClampedArray | number[]

function hex2rgba(hex: string | number): RendererColor {
  let color = hex
  if (typeof color === 'number') {
    color = color.toString()
  }

  if (typeof color !== 'string') {
    throw new Error('Color should be defined as hex string')
  }

  let hexCode = color.slice().replace('#', '').split('')
  if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
    throw new Error('Invalid hex color: ' + color)
  }

  if (hexCode.length === 3 || hexCode.length === 4) {
    hexCode = hexCode.flatMap((c) => [c, c])
  }

  if (hexCode.length === 6) hexCode.push('F', 'F')

  const hexValue = parseInt(hexCode.join(''), 16)

  return {
    r: (hexValue >> 24) & 255,
    g: (hexValue >> 16) & 255,
    b: (hexValue >> 8) & 255,
    a: hexValue & 255,
    hex: '#' + hexCode.slice(0, 6).join(''),
  }
}

export function getOptions(options?: RendererOptionsInput): RendererOptions {
  const opts = options ?? {}
  const color = opts.color ?? {}

  const margin =
    typeof opts.margin === 'undefined' || opts.margin === null || opts.margin < 0
      ? 4
      : opts.margin

  const width = opts.width && opts.width >= 21 ? opts.width : undefined
  const scale = opts.scale || 4

  return {
    width,
    scale: width ? 4 : scale,
    margin,
    color: {
      dark: hex2rgba(color.dark || '#000000ff'),
      light: hex2rgba(color.light || '#ffffffff'),
    },
    type: opts.type,
    rendererOpts: opts.rendererOpts || {},
  }
}

export function getScale(qrSize: number, opts: RendererOptions): number {
  return opts.width && opts.width >= qrSize + opts.margin * 2
    ? opts.width / (qrSize + opts.margin * 2)
    : opts.scale
}

export function getImageWidth(qrSize: number, opts: RendererOptions): number {
  const scale = getScale(qrSize, opts)
  return Math.floor((qrSize + opts.margin * 2) * scale)
}

export function qrToImageData(
  imgData: ImageDataLike,
  qr: QRCodeRenderable,
  opts: RendererOptions,
): void {
  const size = qr.modules.size
  const data = qr.modules.data
  const scale = getScale(size, opts)
  const symbolSize = Math.floor((size + opts.margin * 2) * scale)
  const scaledMargin = opts.margin * scale
  const palette = [opts.color.light, opts.color.dark]

  for (let i = 0; i < symbolSize; i++) {
    for (let j = 0; j < symbolSize; j++) {
      let posDst = (i * symbolSize + j) * 4
      let pxColor = opts.color.light

      if (
        i >= scaledMargin &&
        j >= scaledMargin &&
        i < symbolSize - scaledMargin &&
        j < symbolSize - scaledMargin
      ) {
        const iSrc = Math.floor((i - scaledMargin) / scale)
        const jSrc = Math.floor((j - scaledMargin) / scale)
        pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0]
      }

      imgData[posDst++] = pxColor.r
      imgData[posDst++] = pxColor.g
      imgData[posDst++] = pxColor.b
      imgData[posDst] = pxColor.a
    }
  }
}

export default {
  getOptions,
  getScale,
  getImageWidth,
  qrToImageData,
}
