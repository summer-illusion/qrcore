import { spawnSync } from 'node:child_process'

const bin = (command) => {
  if (process.platform !== 'win32') return command
  if (command === 'npm') return 'npm.cmd'
  if (command === 'npx') return 'npx.cmd'
  return command
}

export const run = (command, args, options = {}) => {
  const result = spawnSync(bin(command), args, {
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited with status ${result.status}`,
    )
  }

  return options.capture ? result.stdout.trim() : ''
}
