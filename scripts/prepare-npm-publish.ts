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
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

export function getUnscopedPackageName(packageName: string): string {
  if (!packageName) {
    throw new Error('package.json name is required before publishing.')
  }

  if (!packageName.startsWith('@')) return packageName

  const separatorIndex = packageName.indexOf('/')
  if (separatorIndex <= 1 || separatorIndex === packageName.length - 1) {
    throw new Error(`Invalid scoped package name: ${packageName}`)
  }

  return packageName.slice(separatorIndex + 1)
}

export function prepareUnscopedNpmPublish(options: PrepareOptions = {}): void {
  const packagePath = options.packagePath ?? 'package.json'
  const lockPath = options.lockPath ?? 'package-lock.json'
  const pkg = readJson<PackageMetadata>(packagePath)
  const currentName = pkg.name ?? ''
  const publishName = getUnscopedPackageName(currentName)

  if (pkg.name !== publishName) {
    pkg.name = publishName
    writeJson(packagePath, pkg)
  }

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

  if (lockChanged) {
    writeJson(lockPath, lock)
  }

  if (currentName === publishName) {
    console.log(`NPM publish name is already unscoped: ${publishName}`)
  } else {
    console.log(
      `Prepared unscoped NPM publish name: ${currentName} -> ${publishName}`,
    )
  }
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  prepareUnscopedNpmPublish()
}
