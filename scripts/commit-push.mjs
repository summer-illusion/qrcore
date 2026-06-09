import { run } from './script-utils.mjs'

const message = process.argv.slice(2).join(' ').trim()

if (!message) {
  console.error('Usage: npm run commit-push -- "chore: update automation"')
  process.exit(1)
}

const branch = run('git', ['branch', '--show-current'], { capture: true })

if (!branch) {
  console.error('Unable to determine current git branch.')
  process.exit(1)
}

run('npm', ['run', 'ci'])
run('git', ['add', '.'])
run('git', ['commit', '-m', message])
run('git', ['push', '-u', 'origin', branch])
