import { spawnSync, type SpawnSyncReturns } from 'node:child_process'

type RunOptions = {
  capture?: boolean
}

const bin = (command: string): string => {
  if (process.platform !== 'win32') return command
  if (command === 'npm') return 'npm.cmd'
  if (command === 'npx') return 'npx.cmd'
  return command
}

export const run = (
  command: string,
  args: string[],
  options: RunOptions = {},
): string => {
  const result = spawnSync(bin(command), args, {
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  }) as SpawnSyncReturns<string>

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
