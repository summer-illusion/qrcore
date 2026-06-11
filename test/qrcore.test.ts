import { describe, expect, it } from 'vitest'

import qrcode, {
  create,
  createMatrix,
  toBuffer,
  toMatrix,
  toString,
} from '../src/index.js'
import toSJIS from '../src/vendor/node-qrcode/helper/to-sjis.cjs'

const toSJISFunc = toSJIS as (codePoint: number) => number

describe('qrcore', () => {
  it('creates QR matrix data', () => {
    const data = create('qrcore')

    expect(data.version).toBeGreaterThanOrEqual(1)
    expect(data.modules.size).toBeGreaterThan(0)
    expect(data.modules.data.length).toBe(data.modules.size * data.modules.size)
  })

  it('exposes a stable headless matrix API', () => {
    const matrix = createMatrix('qrcore', {
      errorCorrectionLevel: 'H',
      maskPattern: 2,
    })
    const aliasMatrix = toMatrix('qrcore matrix')

    expect(matrix).toMatchObject({
      errorCorrectionLevel: 'H',
      maskPattern: 2,
    })
    expect(matrix.version).toBeGreaterThanOrEqual(1)
    expect(matrix.size).toBe(17 + matrix.version * 4)
    expect(matrix.data).toHaveLength(matrix.size * matrix.size)
    expect(matrix.get(0, 0)).toBe(true)
    expect(matrix.get(7, 7)).toBe(false)
    expect(matrix.toRows()).toHaveLength(matrix.size)
    expect(matrix.toRows()[0]).toHaveLength(matrix.size)
    expect(() => matrix.get(-1, 0)).toThrow(RangeError)
    expect(aliasMatrix.data).toHaveLength(aliasMatrix.size * aliasMatrix.size)
    expect(qrcode.createMatrix('default export matrix').size).toBeGreaterThan(0)
    expect(qrcode.toMatrix('default export alias').size).toBeGreaterThan(0)
  })

  it('renders SVG with typed ESM exports', async () => {
    const svg = await toString('typed esm', { type: 'svg' })

    expect(svg).toContain('<svg')
    expect(svg).toContain('shape-rendering="crispEdges"')
  })

  it('keeps the default node-qrcode compatible API', async () => {
    const terminal = await qrcode.toString('default export', {
      type: 'terminal',
    })

    expect(terminal.length).toBeGreaterThan(0)
  })

  it('renders PNG buffers', async () => {
    const buffer = await toBuffer('png output', { type: 'png' })

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  })

  it('keeps upstream Kanji segmentation accurate with surrogate pairs', () => {
    const data = create('漢字かなA😀', { toSJISFunc })
    const segments = data.segments as Array<{
      data: string | Uint8Array
      mode: { id: string }
    }>

    expect(segments.map((segment) => segment.mode.id)).toEqual([
      'Kanji',
      'Byte',
    ])
    expect(segments[0].data).toBe('漢字かな')
    expect(Array.from(segments[1].data as Uint8Array)).toEqual([
      65, 240, 159, 152, 128,
    ])
  })
})
