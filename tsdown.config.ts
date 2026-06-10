import { readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

import { defineConfig } from 'tsdown'
import type { CopyEntry } from 'tsdown'

const vendorSourceRoot = 'src/vendor/node-qrcode'
const vendorOutputRoot = 'dist/vendor/node-qrcode'

function collectVendorFiles(dir = vendorSourceRoot): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(dir, entry.name)
    return entry.isDirectory() ? collectVendorFiles(filePath) : filePath
  })
}

function copyVendorRuntimeFiles(): CopyEntry[] {
  return collectVendorFiles()
    .filter((filePath) => !filePath.endsWith('.ts'))
    .map((filePath) => ({
      from: filePath,
      to: join(vendorOutputRoot, dirname(relative(vendorSourceRoot, filePath))),
    }))
}

const migratedVendorCoreEntries = {
  'vendor/node-qrcode/lib/core/alignment-pattern.impl':
    'src/vendor/node-qrcode/lib/core/alignment-pattern.ts',
  'vendor/node-qrcode/lib/core/alphanumeric-data.impl':
    'src/vendor/node-qrcode/lib/core/alphanumeric-data.ts',
  'vendor/node-qrcode/lib/core/bit-buffer.impl':
    'src/vendor/node-qrcode/lib/core/bit-buffer.ts',
  'vendor/node-qrcode/lib/core/bit-matrix.impl':
    'src/vendor/node-qrcode/lib/core/bit-matrix.ts',
  'vendor/node-qrcode/lib/core/byte-data.impl':
    'src/vendor/node-qrcode/lib/core/byte-data.ts',
  'vendor/node-qrcode/lib/core/error-correction-code.impl':
    'src/vendor/node-qrcode/lib/core/error-correction-code.ts',
  'vendor/node-qrcode/lib/core/error-correction-level.impl':
    'src/vendor/node-qrcode/lib/core/error-correction-level.ts',
  'vendor/node-qrcode/lib/core/finder-pattern.impl':
    'src/vendor/node-qrcode/lib/core/finder-pattern.ts',
  'vendor/node-qrcode/lib/core/format-info.impl':
    'src/vendor/node-qrcode/lib/core/format-info.ts',
  'vendor/node-qrcode/lib/core/galois-field.impl':
    'src/vendor/node-qrcode/lib/core/galois-field.ts',
  'vendor/node-qrcode/lib/core/mask-pattern.impl':
    'src/vendor/node-qrcode/lib/core/mask-pattern.ts',
  'vendor/node-qrcode/lib/core/mode.impl':
    'src/vendor/node-qrcode/lib/core/mode.ts',
  'vendor/node-qrcode/lib/core/kanji-data.impl':
    'src/vendor/node-qrcode/lib/core/kanji-data.ts',
  'vendor/node-qrcode/lib/core/numeric-data.impl':
    'src/vendor/node-qrcode/lib/core/numeric-data.ts',
  'vendor/node-qrcode/lib/core/polynomial.impl':
    'src/vendor/node-qrcode/lib/core/polynomial.ts',
  'vendor/node-qrcode/lib/core/qrcode.impl':
    'src/vendor/node-qrcode/lib/core/qrcode.ts',
  'vendor/node-qrcode/lib/core/reed-solomon-encoder.impl':
    'src/vendor/node-qrcode/lib/core/reed-solomon-encoder.ts',
  'vendor/node-qrcode/lib/core/segments.impl':
    'src/vendor/node-qrcode/lib/core/segments.ts',
  'vendor/node-qrcode/lib/core/utils.impl':
    'src/vendor/node-qrcode/lib/core/utils.ts',
  'vendor/node-qrcode/lib/core/version-check.impl':
    'src/vendor/node-qrcode/lib/core/version-check.ts',
  'vendor/node-qrcode/lib/core/version.impl':
    'src/vendor/node-qrcode/lib/core/version.ts',
  'vendor/node-qrcode/lib/core/regex.impl':
    'src/vendor/node-qrcode/lib/core/regex.ts',
}

const migratedVendorRendererEntries = {
  'vendor/node-qrcode/lib/renderer/canvas.impl':
    'src/vendor/node-qrcode/lib/renderer/canvas.ts',
  'vendor/node-qrcode/lib/renderer/png.impl':
    'src/vendor/node-qrcode/lib/renderer/png.ts',
  'vendor/node-qrcode/lib/renderer/svg-tag.impl':
    'src/vendor/node-qrcode/lib/renderer/svg-tag.ts',
  'vendor/node-qrcode/lib/renderer/svg.impl':
    'src/vendor/node-qrcode/lib/renderer/svg.ts',
  'vendor/node-qrcode/lib/renderer/terminal.impl':
    'src/vendor/node-qrcode/lib/renderer/terminal.ts',
  'vendor/node-qrcode/lib/renderer/terminal/terminal-small.impl':
    'src/vendor/node-qrcode/lib/renderer/terminal/terminal-small.ts',
  'vendor/node-qrcode/lib/renderer/terminal/terminal.impl':
    'src/vendor/node-qrcode/lib/renderer/terminal/terminal.ts',
  'vendor/node-qrcode/lib/renderer/utf8.impl':
    'src/vendor/node-qrcode/lib/renderer/utf8.ts',
  'vendor/node-qrcode/lib/renderer/utils.impl':
    'src/vendor/node-qrcode/lib/renderer/utils.ts',
}

const migratedVendorApiEntries = {
  'vendor/node-qrcode/helper/to-sjis-browser.impl':
    'src/vendor/node-qrcode/helper/to-sjis-browser.ts',
  'vendor/node-qrcode/helper/to-sjis.impl':
    'src/vendor/node-qrcode/helper/to-sjis.ts',
  'vendor/node-qrcode/lib/browser.impl':
    'src/vendor/node-qrcode/lib/browser.ts',
  'vendor/node-qrcode/lib/can-promise.impl':
    'src/vendor/node-qrcode/lib/can-promise.ts',
  'vendor/node-qrcode/lib/index.impl': 'src/vendor/node-qrcode/lib/index.ts',
  'vendor/node-qrcode/lib/server.impl': 'src/vendor/node-qrcode/lib/server.ts',
}

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    exports: false,
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    outputOptions: {
      exports: 'named',
    },
    copy: copyVendorRuntimeFiles,
  },
  {
    entry: {
      cli: 'src/cli.ts',
    },
    format: 'esm',
    dts: false,
    exports: false,
    platform: 'node',
    target: 'node18',
    sourcemap: true,
  },
  {
    entry: {
      ...migratedVendorCoreEntries,
      ...migratedVendorRendererEntries,
      ...migratedVendorApiEntries,
    },
    format: 'cjs',
    dts: false,
    exports: false,
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    outputOptions: {
      exports: 'named',
    },
  },
])
