import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

const esm = await import('../dist/index.mjs')
const cjs = require('../dist/index.cjs')

assert.equal(typeof esm.toString, 'function')
assert.equal(typeof cjs.toString, 'function')

const svg = await esm.toString('esm smoke', { type: 'svg' })
assert.match(svg, /<svg/)

const buffer = await cjs.toBuffer('cjs smoke', { type: 'png' })
assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')

const dir = await mkdtemp(join(tmpdir(), 'qrcore-'))
try {
  const output = join(dir, 'cli.svg')
  const { stdout } = await execFileAsync(process.execPath, ['dist/cli.mjs', '-t', 'svg', '-o', output, 'cli smoke'])
  assert.match(stdout, /saved qrcode to:/)

  const cliSvg = await readFile(output, 'utf8')
  assert.match(cliSvg, /<svg/)
} finally {
  await rm(dir, { recursive: true, force: true })
}
