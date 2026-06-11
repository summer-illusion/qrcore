import { pathToFileURL } from 'node:url'

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-.+)?$/
const PRERELEASE_IDENTIFIER_PATTERN = /^[0-9A-Za-z-]+$/

type ParsedVersion = {
  major: number
  minor: number
  patch: number
  raw: string
}

export const parseVersion = (
  value: unknown,
  label = 'version',
): ParsedVersion => {
  const normalized = String(value || '').trim()
  const match = normalized.match(VERSION_PATTERN)

  if (!match) {
    throw new Error(
      `${label} must be a semver version, got "${normalized || '<empty>'}".`,
    )
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: normalized,
  }
}

export const computeMainVersion = (currentVersion: unknown): string => {
  const current = parseVersion(currentVersion, 'current package version')
  return `${current.major}.${current.minor + 1}.0`
}

export const compareVersions = (
  left: ParsedVersion,
  right: ParsedVersion,
): number => {
  if (left.major !== right.major) return left.major - right.major
  if (left.minor !== right.minor) return left.minor - right.minor
  return left.patch - right.patch
}

const sameReleaseLine = (left: ParsedVersion, right: ParsedVersion): boolean =>
  left.major === right.major && left.minor === right.minor

const compareReleaseLines = (
  left: ParsedVersion,
  right: ParsedVersion,
): number => {
  if (left.major !== right.major) return left.major - right.major
  return left.minor - right.minor
}

const prereleaseIdentifier = (
  value: unknown,
  fallback: unknown,
  label: string,
): string => {
  const normalized = String(value || fallback).trim()

  if (!normalized || !PRERELEASE_IDENTIFIER_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a valid prerelease identifier.`)
  }

  return normalized
}

export function computeBetaVersion({
  currentVersion,
  npmLatestVersion,
  npmBetaVersion,
  mainVersion,
  runNumber,
  runAttempt,
}: {
  currentVersion: unknown
  npmLatestVersion?: unknown
  npmBetaVersion?: unknown
  mainVersion?: unknown
  runNumber?: unknown
  runAttempt?: unknown
}): string {
  const current = parseVersion(currentVersion, 'current package version')
  const candidates = [current]
  const latest = String(npmLatestVersion || '').trim()
  const beta = String(npmBetaVersion || '').trim()
  const main = String(mainVersion || '').trim()

  if (latest) {
    candidates.push(parseVersion(latest, 'npm latest version'))
  }

  if (main) {
    candidates.push(parseVersion(main, 'main branch version'))
  }

  const stableBase = candidates.reduce((highest, candidate) =>
    compareVersions(candidate, highest) > 0 ? candidate : highest,
  )
  const betaBase = beta ? parseVersion(beta, 'npm beta version') : undefined

  if (betaBase && compareReleaseLines(betaBase, stableBase) > 0) {
    throw new Error(
      `npm beta version ${betaBase.raw} is ahead of the selected release line ${stableBase.major}.${stableBase.minor}.x.`,
    )
  }

  const base =
    betaBase &&
    sameReleaseLine(betaBase, stableBase) &&
    compareVersions(betaBase, stableBase) > 0
      ? betaBase
      : stableBase
  const run = prereleaseIdentifier(
    runNumber,
    process.env.GITHUB_RUN_NUMBER || 'local',
    'run number',
  )
  const attempt = prereleaseIdentifier(
    runAttempt,
    process.env.GITHUB_RUN_ATTEMPT || '1',
    'run attempt',
  )

  return `${base.major}.${base.minor}.${base.patch + 1}-beta.${run}.${attempt}`
}

const main = (): void => {
  const args = process.argv.slice(2)
  const [currentVersion, npmLatestVersion, npmBetaVersion, mainVersion] = args

  if (!currentVersion) {
    throw new Error(
      'Usage: tsx scripts/compute-release-version.ts <current-version> [npm-latest-version] [npm-beta-version] [main-version]',
    )
  }

  if (args.length > 1) {
    console.log(
      computeBetaVersion({
        currentVersion,
        npmLatestVersion,
        npmBetaVersion,
        mainVersion,
      }),
    )
    return
  }

  console.log(computeMainVersion(currentVersion))
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
