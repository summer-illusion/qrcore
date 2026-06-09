import { pathToFileURL } from 'node:url'

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-.+)?$/

export const parseVersion = (value, label = 'version') => {
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

export const computeMainVersion = (currentVersion) => {
  const current = parseVersion(currentVersion, 'current package version')
  return `${current.major}.${current.minor + 1}.0`
}

const main = () => {
  const [currentVersion] = process.argv.slice(2)

  if (!currentVersion) {
    throw new Error(
      'Usage: node scripts/compute-release-version.mjs <current-version>',
    )
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
