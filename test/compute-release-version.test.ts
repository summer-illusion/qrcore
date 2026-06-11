import { describe, expect, it } from 'vitest'

import {
  computeBetaVersion,
  computeMainVersion,
  computePatchVersion,
  parseVersion,
} from '../scripts/compute-release-version.mjs'

describe('release version computation', () => {
  it('computes the next main version line', () => {
    expect(computeMainVersion('0.4.0')).toBe('0.5.0')
  })

  it('computes the next dev patch version', () => {
    expect(computePatchVersion('0.4.0')).toBe('0.4.1')
    expect(computePatchVersion('0.4.3')).toBe('0.4.4')
  })

  it('computes beta versions from the selected stable line', () => {
    expect(
      computeBetaVersion({
        currentVersion: '0.4.0',
        runNumber: '123',
        runAttempt: '2',
      }),
    ).toBe('0.4.1-beta.123.2')

    expect(
      computeBetaVersion({
        currentVersion: '0.4.0',
        npmLatestVersion: '0.4.1',
        npmBetaVersion: '0.4.2-beta.9.1',
        mainVersion: '0.4.1',
        runNumber: '123',
        runAttempt: '2',
      }),
    ).toBe('0.4.3-beta.123.2')
  })

  it('rejects beta versions ahead of the selected stable release line', () => {
    expect(() =>
      computeBetaVersion({
        currentVersion: '0.4.0',
        npmBetaVersion: '0.5.0-beta.1.1',
        runNumber: '123',
        runAttempt: '2',
      }),
    ).toThrow('ahead of the selected release line')
  })

  it('validates semver input', () => {
    expect(parseVersion('v1.2.3')).toMatchObject({
      major: 1,
      minor: 2,
      patch: 3,
    })
    expect(() => parseVersion('1.2')).toThrow('must be a semver version')
  })
})
