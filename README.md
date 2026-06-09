# qrcore

Modern QR Code generator built on the proven `soldair/node-qrcode` core, with typed ESM, CommonJS, and a lighter CLI.

## Install

```sh
npm install qrcore
```

## API

```ts
import { toString, toBuffer, create } from 'qrcore'

const svg = await toString('hello qrcore', { type: 'svg' })
const png = await toBuffer('hello qrcore', { type: 'png' })
const data = create('hello qrcore')
```

CommonJS is supported too:

```js
const qrcode = require('qrcore')

qrcode.toString('hello cjs', { type: 'terminal' }).then(console.log)
```

## CLI

```sh
qrcode "some text"
qrcode -o out.png "some text"
qrcode -t svg -o out.svg "some text"
```

The CLI uses `cleye` instead of `yargs`, while keeping the familiar `node-qrcode` flags:

- `-v, --qversion`: QR Code symbol version, 1-40
- `-e, --error`: error correction level, `L`, `M`, `Q`, or `H`
- `-m, --mask`: mask pattern, 0-7
- `-t, --type`: output type, `png`, `svg`, or `utf8`
- `-o, --output`: output file path
- `-w, --width`, `-s, --scale`, `-q, --qzone`
- `-l, --lightcolor`, `-d, --darkcolor`
- `--small`, `-i, --inverse`

## Development

```sh
npm ci
npm run ci
```

The local and CI quality gate runs linting, type checking, tests, build, smoke checks for ESM/CJS/CLI output, and `npm pack --dry-run`.

Release helpers:

```sh
npm run release -- patch
git push origin main --tags
```

Publishing is handled by the manual `Publish Package` GitHub Actions workflow. It reruns the full gate before `npm publish --provenance`.

## Upstream Lineage

The QR encoder and renderers are vendored from [`soldair/node-qrcode`](https://github.com/soldair/node-qrcode) at commit `3848ed2` (`1.5.4`) under `src/vendor/node-qrcode`.

This package modernizes that baseline by:

- publishing typed ESM and CommonJS entry points from one TypeScript facade
- replacing the `yargs` CLI with `cleye`
- updating runtime dependencies such as `pngjs`
- retaining upstream fixes already present in `1.5.4`, including duplicate callback protection in the PNG file renderer
- porting the Kanji detection and segmentation fix from upstream PR `#400`

Relevant upstream PR ideas considered during this modernization:

- ESM support: PRs `#401`, `#241`, `#309`
- yargs replacement/update: PRs `#408`, `#403`, `#255`
- browser bundle repair: PR `#402`
- Kanji detection: PR `#400` (ported)
- dependency cleanup/update: PRs `#410`, `#404`, `#405`, `#406`, `#353`
- flaky file tests and callback stability: PRs `#409`, `#273`
