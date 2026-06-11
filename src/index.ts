import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const qrcode = require('./vendor/node-qrcode/lib/server.cjs') as QRCodeModule

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
export type QRMode = 'numeric' | 'alphanumeric' | 'byte' | 'kanji'
export type OutputType =
  | 'png'
  | 'svg'
  | 'utf8'
  | 'terminal'
  | 'txt'
  | 'image/png'

export interface QRSegment {
  data: string | Uint8Array | number[]
  mode?: QRMode
}

export type QRInput = string | QRSegment[]

export interface QRColorOptions {
  dark?: string
  light?: string
}

export interface QRRenderOptions {
  version?: number
  errorCorrectionLevel?: ErrorCorrectionLevel
  maskPattern?: number
  margin?: number
  scale?: number
  width?: number
  type?: OutputType
  color?: QRColorOptions
  small?: boolean
  inverse?: boolean
  rendererOpts?: Record<string, unknown>
  toSJISFunc?: (codePoint: number) => number
}

export interface QRBitMatrix {
  size: number
  data: boolean[]
  reservedBit: boolean[]
  get(row: number, col: number): boolean
  set(row: number, col: number, value: boolean, reserved?: boolean): void
  xor(row: number, col: number, value: boolean): void
  isReserved(row: number, col: number): boolean
}

export interface QRCodeData {
  modules: QRBitMatrix
  version: number
  errorCorrectionLevel: {
    bit: number
  }
  maskPattern: number
  segments: unknown[]
}

export interface QRMatrix {
  readonly size: number
  readonly version: number
  readonly errorCorrectionLevel: ErrorCorrectionLevel
  readonly maskPattern: number
  readonly data: readonly boolean[]
  get(row: number, column: number): boolean
  toRows(): boolean[][]
}

export type QRCallback<T> = (error: Error | null, result: T) => void
export type QREmptyCallback = (error?: Error | null) => void

export interface QRCodeModule {
  create(data: QRInput, options?: QRRenderOptions): QRCodeData

  toString(text: QRInput, options?: QRRenderOptions): Promise<string>
  toString(text: QRInput, callback: QRCallback<string>): void
  toString(
    text: QRInput,
    options: QRRenderOptions,
    callback: QRCallback<string>,
  ): void

  toDataURL(text: QRInput, options?: QRRenderOptions): Promise<string>
  toDataURL(text: QRInput, callback: QRCallback<string>): void
  toDataURL(
    text: QRInput,
    options: QRRenderOptions,
    callback: QRCallback<string>,
  ): void

  toBuffer(text: QRInput, options?: QRRenderOptions): Promise<Buffer>
  toBuffer(text: QRInput, callback: QRCallback<Buffer>): void
  toBuffer(
    text: QRInput,
    options: QRRenderOptions,
    callback: QRCallback<Buffer>,
  ): void

  toFile(path: string, text: QRInput, options?: QRRenderOptions): Promise<void>
  toFile(path: string, text: QRInput, callback: QREmptyCallback): void
  toFile(
    path: string,
    text: QRInput,
    options: QRRenderOptions,
    callback: QREmptyCallback,
  ): void

  toFileStream(
    stream: NodeJS.WritableStream,
    text: QRInput,
    options?: QRRenderOptions,
  ): void

  toCanvas(
    canvas: HTMLCanvasElement,
    text: QRInput,
    options?: QRRenderOptions,
  ): Promise<HTMLCanvasElement>
  toCanvas(
    canvas: HTMLCanvasElement,
    text: QRInput,
    callback: QRCallback<HTMLCanvasElement>,
  ): void
  toCanvas(
    canvas: HTMLCanvasElement,
    text: QRInput,
    options: QRRenderOptions,
    callback: QRCallback<HTMLCanvasElement>,
  ): void
}

export interface QRCoreModule extends QRCodeModule {
  createMatrix(data: QRInput, options?: QRRenderOptions): QRMatrix
  toMatrix(data: QRInput, options?: QRRenderOptions): QRMatrix
}

function errorCorrectionLevelFromBit(bit: number): ErrorCorrectionLevel {
  switch (bit) {
    case 1:
      return 'L'
    case 0:
      return 'M'
    case 3:
      return 'Q'
    case 2:
      return 'H'
    default:
      throw new Error(`Unknown QR error correction bit: ${bit}`)
  }
}

function assertMatrixIndex(size: number, row: number, column: number): void {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(column) ||
    row < 0 ||
    column < 0 ||
    row >= size ||
    column >= size
  ) {
    throw new RangeError(
      `Matrix coordinates out of range: row ${row}, column ${column}, size ${size}`,
    )
  }
}

export const create = qrcode.create
export const toString = qrcode.toString
export const toDataURL = qrcode.toDataURL
export const toBuffer = qrcode.toBuffer
export const toFile = qrcode.toFile
export const toFileStream = qrcode.toFileStream
export const toCanvas = qrcode.toCanvas

export function createMatrix(
  data: QRInput,
  options?: QRRenderOptions,
): QRMatrix {
  const qr = create(data, options)
  const size = qr.modules.size
  const matrixData = Object.freeze(
    Array.from({ length: size * size }, (_, index) =>
      Boolean(qr.modules.data[index]),
    ),
  )

  return Object.freeze({
    size,
    version: qr.version,
    errorCorrectionLevel: errorCorrectionLevelFromBit(
      qr.errorCorrectionLevel.bit,
    ),
    maskPattern: qr.maskPattern,
    data: matrixData,
    get(row: number, column: number) {
      assertMatrixIndex(size, row, column)
      return matrixData[row * size + column]
    },
    toRows() {
      return Array.from({ length: size }, (_, row) =>
        matrixData.slice(row * size, (row + 1) * size),
      )
    },
  })
}

export const toMatrix = createMatrix

const qrcore = Object.assign(qrcode, {
  createMatrix,
  toMatrix,
}) as QRCoreModule

export default qrcore
