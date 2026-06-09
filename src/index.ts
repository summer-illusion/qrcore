import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const qrcode = require('./vendor/node-qrcode/lib/server.cjs') as QRCodeModule

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
export type QRMode = 'numeric' | 'alphanumeric' | 'byte' | 'kanji'
export type OutputType = 'png' | 'svg' | 'utf8' | 'terminal' | 'txt' | 'image/png'

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

export type QRCallback<T> = (error: Error | null, result: T) => void
export type QREmptyCallback = (error?: Error | null) => void

export interface QRCodeModule {
  create(data: QRInput, options?: QRRenderOptions): QRCodeData

  toString(text: QRInput, options?: QRRenderOptions): Promise<string>
  toString(text: QRInput, callback: QRCallback<string>): void
  toString(text: QRInput, options: QRRenderOptions, callback: QRCallback<string>): void

  toDataURL(text: QRInput, options?: QRRenderOptions): Promise<string>
  toDataURL(text: QRInput, callback: QRCallback<string>): void
  toDataURL(text: QRInput, options: QRRenderOptions, callback: QRCallback<string>): void

  toBuffer(text: QRInput, options?: QRRenderOptions): Promise<Buffer>
  toBuffer(text: QRInput, callback: QRCallback<Buffer>): void
  toBuffer(text: QRInput, options: QRRenderOptions, callback: QRCallback<Buffer>): void

  toFile(path: string, text: QRInput, options?: QRRenderOptions): Promise<void>
  toFile(path: string, text: QRInput, callback: QREmptyCallback): void
  toFile(path: string, text: QRInput, options: QRRenderOptions, callback: QREmptyCallback): void

  toFileStream(stream: NodeJS.WritableStream, text: QRInput, options?: QRRenderOptions): void

  toCanvas(canvas: HTMLCanvasElement, text: QRInput, options?: QRRenderOptions): Promise<HTMLCanvasElement>
  toCanvas(canvas: HTMLCanvasElement, text: QRInput, callback: QRCallback<HTMLCanvasElement>): void
  toCanvas(
    canvas: HTMLCanvasElement,
    text: QRInput,
    options: QRRenderOptions,
    callback: QRCallback<HTMLCanvasElement>,
  ): void
}

export const create = qrcode.create
export const toString = qrcode.toString
export const toDataURL = qrcode.toDataURL
export const toBuffer = qrcode.toBuffer
export const toFile = qrcode.toFile
export const toFileStream = qrcode.toFileStream
export const toCanvas = qrcode.toCanvas

export default qrcode
