import { defineConfig } from 'tsdown'

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
    copy: {
      from: 'src/vendor/node-qrcode',
      to: 'dist/vendor',
    },
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
])
