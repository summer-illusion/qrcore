import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  prepareNpmPublish,
  validatePackageName,
} from '../scripts/prepare-npm-publish.ts'

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

describe('prepare npm publish metadata', () => {
  it('validates npm package names without stripping scopes', () => {
    expect(validatePackageName('@sansenjian/qrcore')).toBe('@sansenjian/qrcore')
    expect(validatePackageName('qrcore')).toBe('qrcore')
    expect(() => validatePackageName('@sansenjian')).toThrow(
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
        JSON.stringify({ name: '@sansenjian/qrcore', version: '1.0.0' }),
      )
      writeFileSync(
        lockPath,
        JSON.stringify({
          name: '@sansenjian/qrcore',
          version: '1.0.0',
          packages: {
            '': {
              name: '@sansenjian/qrcore',
              version: '1.0.0',
            },
          },
        }),
      )

      prepareNpmPublish({
        packagePath,
        lockPath,
        version: '1.0.1-beta.12.1',
      })

      expect(readJson<{ name: string; version: string }>(packagePath)).toEqual({
        name: '@sansenjian/qrcore',
        version: '1.0.1-beta.12.1',
      })
      expect(readJson<{ name: string; version: string }>(lockPath)).toEqual(
        expect.objectContaining({
          name: '@sansenjian/qrcore',
          version: '1.0.1-beta.12.1',
        }),
      )
      expect(
        readJson<{ packages: { '': { name: string; version: string } } }>(
          lockPath,
        ).packages[''],
      ).toEqual({
        name: '@sansenjian/qrcore',
        version: '1.0.1-beta.12.1',
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
