import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'

import {
  computeMainVersion,
  computePatchVersion,
} from './compute-release-version.mjs'
import { generateChangelog } from './generate-changelog.ts'

type PackageMetadata = {
  version: string
  [key: string]: unknown
}

type PackageLock = {
  version?: string
  packages?: Record<string, { version?: string }>
  [key: string]: unknown
}

const bumpType =
  process.argv[2] ??
  (process.env.GITHUB_REF_NAME === 'main' ? 'minor' : 'patch')

if (bumpType !== 'patch' && bumpType !== 'minor') {
  throw new Error(`Unsupported version bump type: ${bumpType}`)
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as PackageMetadata
console.log(`Bumping ${String(pkg.name ?? 'package')} ${bumpType} version...`)

const oldVersion = pkg.version
const newVersion =
  bumpType === 'minor'
    ? computeMainVersion(oldVersion)
    : computePatchVersion(oldVersion)

pkg.version = newVersion
writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

const lock = JSON.parse(
  readFileSync('package-lock.json', 'utf8'),
) as PackageLock
lock.version = newVersion
if (lock.packages?.['']) {
  lock.packages[''].version = newVersion
}
writeFileSync('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`)

console.log(`Version bumped from ${oldVersion} to ${newVersion}`)
console.log('Generating CHANGELOG...')
generateChangelog()

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `new_version=${newVersion}\n`)
}

console.log(`New version: ${newVersion}`)
