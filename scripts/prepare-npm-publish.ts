import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

type PackageMetadata = {
  name?: string
  [key: string]: unknown
}

type PackageLockRoot = {
  name?: string
  [key: string]: unknown
}

type PackageLock = {
  name?: string
  packages?: Record<string, PackageLockRoot | undefined>
  [key: string]: unknown
}

type PrepareOptions = {
  packagePath?: string
  lockPath?: string
  version?: string
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

export function getPublishPackageName(packageName: string): string {
  if (!packageName) {
    throw new Error('package.json name is required before publishing.')
  }

  if (!packageName.startsWith('@')) return packageName

  const separatorIndex = packageName.indexOf('/')
  if (separatorIndex <= 1 || separatorIndex === packageName.length - 1) {
    throw new Error(`Invalid scoped package name: ${packageName}`)
  }

  return packageName
}

export function prepareNpmPublishMetadata(options: PrepareOptions = {}): void {
  const packagePath = options.packagePath ?? 'package.json'
  const lockPath = options.lockPath ?? 'package-lock.json'
  const pkg = readJson<PackageMetadata>(packagePath)
  const currentName = pkg.name ?? ''
  const publishName = getPublishPackageName(currentName)
  const publishVersion = options.version?.trim()

  if (pkg.name !== publishName) {
    pkg.name = publishName
  }

  if (publishVersion && pkg.version !== publishVersion) {
    pkg.version = publishVersion
  }

  writeJson(packagePath, pkg)

  const lock = readJson<PackageLock>(lockPath)
  let lockChanged = false

  if (lock.name && lock.name !== publishName) {
    lock.name = publishName
    lockChanged = true
  }

  if (lock.packages?.['']?.name && lock.packages[''].name !== publishName) {
    lock.packages[''].name = publishName
    lockChanged = true
  }

  if (publishVersion && lock.version !== publishVersion) {
    lock.version = publishVersion
    lockChanged = true
  }

  if (
    publishVersion &&
    lock.packages?.['']?.version &&
    lock.packages[''].version !== publishVersion
  ) {
    lock.packages[''].version = publishVersion
    lockChanged = true
  }

  if (lockChanged) {
    writeJson(lockPath, lock)
  }

  console.log(`Prepared NPM publish package: ${publishName}`)

  if (publishVersion) {
    console.log(`Prepared NPM publish version: ${publishVersion}`)
  }
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  prepareNpmPublishMetadata({ version: process.env.PUBLISH_VERSION })
}
