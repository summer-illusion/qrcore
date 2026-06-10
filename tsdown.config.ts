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
  'vendor/node-qrcode/lib/core/bit-buffer.impl':
    'src/vendor/node-qrcode/lib/core/bit-buffer.ts',
  'vendor/node-qrcode/lib/core/bit-matrix.impl':
    'src/vendor/node-qrcode/lib/core/bit-matrix.ts',
  'vendor/node-qrcode/lib/core/galois-field.impl':
    'src/vendor/node-qrcode/lib/core/galois-field.ts',
  'vendor/node-qrcode/lib/core/version-check.impl':
    'src/vendor/node-qrcode/lib/core/version-check.ts',
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
    entry: migratedVendorCoreEntries,
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
