import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const releaseType = process.argv[2] ?? 'patch'
const allowedReleaseTypes = new Set([
  'major',
  'minor',
  'patch',
  'premajor',
  'preminor',
  'prepatch',
  'prerelease',
])

if (!allowedReleaseTypes.has(releaseType)) {
  console.error(
    `Unsupported release type "${releaseType}". Use one of: ${[...allowedReleaseTypes].join(', ')}`,
  )
  process.exit(1)
}

function run(command, args) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim()
}

function hasChanges() {
  return run('git', ['status', '--porcelain']).length > 0
}

if (hasChanges()) {
  console.error('Working tree must be clean before running release.')
  process.exit(1)
}

const newVersion = run('npm', ['version', releaseType, '--no-git-tag-version'])
const version = newVersion.replace(/^v/, '')
const today = new Date().toISOString().slice(0, 10)
const changelogPath = 'CHANGELOG.md'
let changelog = ''

try {
  changelog = readFileSync(changelogPath, 'utf8')
} catch {
  changelog = '# Changelog\n\n'
}

const entry = `## ${version} - ${today}\n\n- Prepare release ${newVersion}.\n\n`
if (changelog.startsWith('# Changelog\n\n')) {
  changelog = changelog.replace('# Changelog\n\n', `# Changelog\n\n${entry}`)
} else {
  changelog = `# Changelog\n\n${entry}${changelog}`
}

writeFileSync(changelogPath, changelog)
run('git', ['add', 'package.json', 'package-lock.json', changelogPath])
run('git', ['commit', '-m', `chore(release): ${newVersion}`])
run('git', ['tag', newVersion])

console.log(
  `Created release commit and tag ${newVersion}. Push with: git push origin main --tags`,
)
