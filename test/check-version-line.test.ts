import { describe, expect, it } from 'vitest'

import { assertSameVersionLine } from '../scripts/check-version-line.mjs'

describe('dev version line checks', () => {
  it('allows dev patch versions on the main release line', () => {
    expect(
      assertSameVersionLine({
        currentVersion: '0.4.3',
        baseVersion: '0.4.0',
        currentLabel: 'dev package version',
        baseLabel: 'main package version',
      }),
    ).toEqual({ currentLine: '0.4', baseLine: '0.4' })
  })

  it('rejects dev minor drift from main', () => {
    expect(() =>
      assertSameVersionLine({
        currentVersion: '0.7.0',
        baseVersion: '0.4.0',
        currentLabel: 'dev package version',
        baseLabel: 'main package version',
      }),
    ).toThrow('dev package version line 0.7.x must match')
  })
})
