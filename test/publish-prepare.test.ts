import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  getUnscopedPackageName,
  prepareUnscopedNpmPublish,
} from '../scripts/prepare-npm-publish.ts'

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

describe('prepare npm publish metadata', () => {
  it('strips npm scopes from package names', () => {
    expect(getUnscopedPackageName('@summer-illusion/qrcore')).toBe('qrcore')
    expect(getUnscopedPackageName('qrcore')).toBe('qrcore')
    expect(() => getUnscopedPackageName('@summer-illusion')).toThrow(
      'Invalid scoped package name',
    )
  })

  it('normalizes package and lockfile root names for npm publish', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qrcore-publish-'))
    const packagePath = join(dir, 'package.json')
    const lockPath = join(dir, 'package-lock.json')

    try {
      writeFileSync(
        packagePath,
        JSON.stringify({ name: '@summer-illusion/qrcore', version: '1.0.0' }),
      )
      writeFileSync(
        lockPath,
        JSON.stringify({
          name: '@summer-illusion/qrcore',
          version: '1.0.0',
          packages: {
            '': {
              name: '@summer-illusion/qrcore',
              version: '1.0.0',
            },
          },
        }),
      )

      prepareUnscopedNpmPublish({
        packagePath,
        lockPath,
        version: '1.0.1-beta.12.1',
      })

      expect(readJson<{ name: string; version: string }>(packagePath)).toEqual({
        name: 'qrcore',
        version: '1.0.1-beta.12.1',
      })
      expect(readJson<{ name: string; version: string }>(lockPath)).toEqual(
        expect.objectContaining({
          name: 'qrcore',
          version: '1.0.1-beta.12.1',
        }),
      )
      expect(
        readJson<{ packages: { '': { name: string; version: string } } }>(
          lockPath,
        ).packages[''],
      ).toEqual({
        name: 'qrcore',
        version: '1.0.1-beta.12.1',
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
