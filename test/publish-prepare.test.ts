import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  getPublishPackageName,
  prepareNpmPublishMetadata,
} from '../scripts/prepare-npm-publish.ts'

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

describe('prepare npm publish metadata', () => {
  it('keeps scoped package names for npm publish', () => {
    expect(getPublishPackageName('@qrcore/core')).toBe('@qrcore/core')
    expect(getPublishPackageName('qrcore')).toBe('qrcore')
    expect(() => getPublishPackageName('@qrcore')).toThrow(
      'Invalid scoped package name',
    )
  })

  it('normalizes lockfile root name and publish version', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qrcore-publish-'))
    const packagePath = join(dir, 'package.json')
    const lockPath = join(dir, 'package-lock.json')

    try {
      writeFileSync(
        packagePath,
        JSON.stringify({ name: '@qrcore/core', version: '1.0.0' }),
      )
      writeFileSync(
        lockPath,
        JSON.stringify({
          name: 'qrcore',
          version: '1.0.0',
          packages: {
            '': {
              name: 'qrcore',
              version: '1.0.0',
            },
          },
        }),
      )

      prepareNpmPublishMetadata({
        packagePath,
        lockPath,
        version: '1.0.1-beta.12.1',
      })

      expect(readJson<{ name: string; version: string }>(packagePath)).toEqual({
        name: '@qrcore/core',
        version: '1.0.1-beta.12.1',
      })
      expect(readJson<{ name: string; version: string }>(lockPath)).toEqual(
        expect.objectContaining({
          name: '@qrcore/core',
          version: '1.0.1-beta.12.1',
        }),
      )
      expect(
        readJson<{ packages: { '': { name: string; version: string } } }>(
          lockPath,
        ).packages[''],
      ).toEqual({
        name: '@qrcore/core',
        version: '1.0.1-beta.12.1',
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
