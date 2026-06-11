import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'

import { computeMainVersion } from './compute-release-version.ts'
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

console.log('Bumping qrcore version...')

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as PackageMetadata
const oldVersion = pkg.version
const newVersion = computeMainVersion(oldVersion)

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
