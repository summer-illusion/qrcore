import { createRequire } from 'node:module'

import type AlphanumericDataModule from './alphanumeric-data.ts'
import type ByteDataModule from './byte-data.ts'
import type KanjiDataModule from './kanji-data.ts'
import type * as ModeModule from './mode.ts'
import type NumericDataModule from './numeric-data.ts'
import type * as RegexModule from './regex.ts'
import type * as UtilsModule from './utils.ts'

const require = createRequire(import.meta.url)
const Mode = require('./mode.cjs') as typeof ModeModule
const NumericData = require('./numeric-data.cjs') as typeof NumericDataModule
const AlphanumericData = require(
  './alphanumeric-data.cjs',
) as typeof AlphanumericDataModule
const ByteData = require('./byte-data.cjs') as typeof ByteDataModule
const KanjiData = require('./kanji-data.cjs') as typeof KanjiDataModule
const Regex = require('./regex.cjs') as typeof RegexModule
const Utils = require('./utils.cjs') as typeof UtilsModule
const dijkstra = require('dijkstrajs') as {
  find_path(graph: GraphMap, start: string, end: string): string[]
}

type SegmentData = string | Uint8Array | number[] | ArrayLike<number>

interface SegmentInfo {
  data: string
  mode: ModeModule.Mode
  length: number
  pos?: number
}

interface SegmentLike {
  mode: ModeModule.Mode
  data: string | Uint8Array
  getLength(): number
  getBitsLength(): number
  write(bitBuffer: unknown): void
}

interface SegmentInput {
  data?: SegmentData
  mode?: ModeModule.Mode | string
}

type GraphMap = Record<string, Record<string, number>>

interface GraphTableEntry {
  node: SegmentInfo
  lastCount: number
}

function getStringByteLength(str: string): number {
  return unescape(encodeURIComponent(str)).length
}

function getSegmentsFromString(dataStr: string): SegmentInfo[] {
  const segs: SegmentInfo[] = []
  let pos = 0

  while (pos < dataStr.length) {
    let mode: ModeModule.Mode
    const codePoint = dataStr.codePointAt(pos) ?? 0
    const utf16Len = codePoint > 0xffff ? 2 : 1

    if (Regex.isNumeric(dataStr, pos)) {
      mode = Mode.NUMERIC
    } else if (Regex.isAlphanumeric(dataStr, pos)) {
      mode = Mode.ALPHANUMERIC
    } else if (Regex.isKanji(dataStr, pos)) {
      mode = Mode.KANJI
    } else {
      mode = Mode.BYTE
    }

    if (segs.length === 0 || segs[segs.length - 1].mode !== mode) {
      segs.push({
        pos,
        mode,
        length: utf16Len,
        data: '',
      })
    } else {
      segs[segs.length - 1].length += utf16Len
    }

    pos += utf16Len
  }

  return segs.map((obj) => ({
    data: dataStr.slice(obj.pos, (obj.pos ?? 0) + obj.length),
    mode: obj.mode,
    length: obj.length,
  }))
}

function getSegmentBitsLength(
  length: number,
  mode: ModeModule.Mode,
): number {
  switch (mode) {
    case Mode.NUMERIC:
      return NumericData.getBitsLength(length)
    case Mode.ALPHANUMERIC:
      return AlphanumericData.getBitsLength(length)
    case Mode.KANJI:
      return KanjiData.getBitsLength(length)
    case Mode.BYTE:
      return ByteData.getBitsLength(length)
    default:
      return 0
  }
}

function mergeSegments(segs: SegmentInfo[]): SegmentInfo[] {
  return segs.reduce<SegmentInfo[]>((acc, curr) => {
    const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null
    if (prevSeg && prevSeg.mode === curr.mode) {
      acc[acc.length - 1].data += curr.data
      acc[acc.length - 1].length += curr.length
      return acc
    }

    acc.push({ ...curr })
    return acc
  }, [])
}

function buildNodes(segs: SegmentInfo[]): SegmentInfo[][] {
  const nodes: SegmentInfo[][] = []
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]

    switch (seg.mode) {
      case Mode.NUMERIC:
        nodes.push([
          seg,
          { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
          { data: seg.data, mode: Mode.BYTE, length: seg.length },
        ])
        break
      case Mode.ALPHANUMERIC:
        nodes.push([
          seg,
          { data: seg.data, mode: Mode.BYTE, length: seg.length },
        ])
        break
      case Mode.KANJI:
        nodes.push([
          seg,
          {
            data: seg.data,
            mode: Mode.BYTE,
            length: getStringByteLength(seg.data),
          },
        ])
        break
      case Mode.BYTE:
        nodes.push([
          {
            data: seg.data,
            mode: Mode.BYTE,
            length: getStringByteLength(seg.data),
          },
        ])
    }
  }

  return nodes
}

function buildGraph(
  nodes: SegmentInfo[][],
  version: number,
): { map: GraphMap; table: Record<string, GraphTableEntry> } {
  const table: Record<string, GraphTableEntry> = {}
  const graph: GraphMap = { start: {} }
  let prevNodeIds = ['start']

  for (let i = 0; i < nodes.length; i++) {
    const nodeGroup = nodes[i]
    const currentNodeIds: string[] = []

    for (let j = 0; j < nodeGroup.length; j++) {
      const node = nodeGroup[j]
      const key = '' + i + j

      currentNodeIds.push(key)
      table[key] = { node, lastCount: 0 }
      graph[key] = {}

      for (let n = 0; n < prevNodeIds.length; n++) {
        const prevNodeId = prevNodeIds[n]
        const prevEntry = table[prevNodeId]

        if (prevEntry && prevEntry.node.mode === node.mode) {
          graph[prevNodeId][key] =
            getSegmentBitsLength(prevEntry.lastCount + node.length, node.mode) -
            getSegmentBitsLength(prevEntry.lastCount, node.mode)

          prevEntry.lastCount += node.length
        } else {
          if (prevEntry) prevEntry.lastCount = node.length

          graph[prevNodeId][key] =
            getSegmentBitsLength(node.length, node.mode) +
            4 +
            Mode.getCharCountIndicator(node.mode, version)
        }
      }
    }

    prevNodeIds = currentNodeIds
  }

  for (let n = 0; n < prevNodeIds.length; n++) {
    graph[prevNodeIds[n]].end = 0
  }

  return { map: graph, table }
}

function buildSingleSegment(
  data: SegmentData,
  modesHint?: ModeModule.Mode | string | null,
): SegmentLike {
  const bestMode = Mode.getBestModeForData(String(data))
  let mode = Mode.from(modesHint, bestMode) ?? bestMode

  if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
    throw new Error(
      '"' +
        String(data) +
        '"' +
        ' cannot be encoded with mode ' +
        Mode.toString(mode) +
        '.\n Suggested mode is: ' +
        Mode.toString(bestMode),
    )
  }

  if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
    mode = Mode.BYTE
  }

  switch (mode) {
    case Mode.NUMERIC:
      return new NumericData(data as { toString(): string })
    case Mode.ALPHANUMERIC:
      return new AlphanumericData(String(data))
    case Mode.KANJI:
      return new KanjiData(String(data))
    case Mode.BYTE:
    default:
      return new ByteData(data as string | ArrayLike<number> | ArrayBufferLike)
  }
}

export function fromArray(array: Array<string | SegmentInput>): SegmentLike[] {
  return array.reduce<SegmentLike[]>((acc, seg) => {
    if (typeof seg === 'string') {
      acc.push(buildSingleSegment(seg, null))
    } else if (seg.data) {
      acc.push(buildSingleSegment(seg.data, seg.mode))
    }

    return acc
  }, [])
}

export function fromString(data: string, version: number): SegmentLike[] {
  const segs = getSegmentsFromString(data)

  const nodes = buildNodes(segs)
  const graph = buildGraph(nodes, version)
  const path = dijkstra.find_path(graph.map, 'start', 'end')

  const optimizedSegs: SegmentInfo[] = []
  for (let i = 1; i < path.length - 1; i++) {
    optimizedSegs.push(graph.table[path[i]].node)
  }

  return fromArray(mergeSegments(optimizedSegs))
}

export function rawSplit(data: string): SegmentLike[] {
  return fromArray(getSegmentsFromString(data))
}

export default {
  fromArray,
  fromString,
  rawSplit,
}
