import { getSymbolSize } from './utils.ts'

const FINDER_PATTERN_SIZE = 7

export type FinderPosition = [number, number]

export function getPositions(version: number): FinderPosition[] {
  const size = getSymbolSize(version)

  return [
    [0, 0],
    [size - FINDER_PATTERN_SIZE, 0],
    [0, size - FINDER_PATTERN_SIZE],
  ]
}

export default {
  getPositions,
}
