import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

type PackageMetadata = {
  version?: string
  repository?: string | { url?: string }
}

type ChangelogOptions = {
  changelogPath?: string
  packagePath?: string
}

type ChangelogGroup = {
  title: string
  types: string[]
}

const runGit = (args: string[], fallback = ''): string => {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return fallback
  }
}

const normalizeRepositoryUrl = (url: unknown): string =>
  String(url || '')
    .replace(/^git\+/, '')
    .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '')

export const generateChangelog = ({
  changelogPath = 'CHANGELOG.md',
  packagePath = 'package.json',
}: ChangelogOptions = {}): void => {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8')) as PackageMetadata
  const version = String(pkg.version || '')
  const today = new Date().toISOString().slice(0, 10)
  const repositoryUrl = normalizeRepositoryUrl(
    typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url,
  )
  const existingChangelog = existsSync(changelogPath)
    ? readFileSync(changelogPath, 'utf8')
    : ''
  const versionHeadingPattern = new RegExp(
    `^## \\[?${version.replaceAll('.', '\\.')}\\]?\\b`,
    'm',
  )

  if (versionHeadingPattern.test(existingChangelog)) {
    console.log(`CHANGELOG already contains version ${version}`)
    return
  }

  const latestTag = runGit(['describe', '--tags', '--abbrev=0'], '')
  const range = latestTag ? `${latestTag}..HEAD` : 'HEAD'
  const gitLog = runGit(['log', '--no-merges', '--format=%H%x1f%s', range], '')

  const groups: ChangelogGroup[] = [
    { title: 'Features', types: ['feat'] },
    { title: 'Bug Fixes', types: ['fix'] },
    { title: 'Performance Improvements', types: ['perf'] },
    { title: 'Documentation', types: ['docs'] },
    { title: 'Build System', types: ['build', 'ci'] },
    { title: 'Tests', types: ['test'] },
    { title: 'Code Refactoring', types: ['refactor'] },
    {
      title: 'Other Changes',
      types: ['chore', 'style', 'revert', 'config', 'other'],
    },
  ]

  const entries = new Map<string, string[]>(
    groups.map((group) => [group.title, []]),
  )

  const parseCommit = (line: string): void => {
    const [hash, subject = ''] = line.split('\x1f')
    const conventionalMatch = subject.match(/^(\w+)(?:\([^)]+\))?(!)?:\s*(.+)$/)
    const type = conventionalMatch?.[1] || 'other'
    const message = conventionalMatch?.[3] || subject
    const group =
      groups.find((item) => item.types.includes(type)) ??
      groups[groups.length - 1]
    const shortHash = hash.slice(0, 7)
    const hashText = repositoryUrl
      ? `[${shortHash}](${repositoryUrl}/commit/${hash})`
      : shortHash

    entries.get(group.title)?.push(`- ${message} (${hashText})`)
  }

  if (gitLog) {
    gitLog.split('\n').filter(Boolean).forEach(parseCommit)
  }

  const lines = [`## ${version} - ${today}`, '']

  let hasEntries = false
  for (const group of groups) {
    const groupEntries = entries.get(group.title) || []
    if (groupEntries.length === 0) continue

    hasEntries = true
    lines.push(`### ${group.title}`, '', ...groupEntries, '')
  }

  if (!hasEntries) {
    lines.push('- No notable changes.', '')
  }

  const nextChangelog =
    `${lines.join('\n')}\n${existingChangelog}`.trimEnd() + '\n'
  writeFileSync(changelogPath, nextChangelog)
  console.log(`CHANGELOG generated for ${version}`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  generateChangelog()
}
