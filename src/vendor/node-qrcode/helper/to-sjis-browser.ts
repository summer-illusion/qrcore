import { createRequire } from 'node:module'

import type toSJISModule from './to-sjis.ts'

const require = createRequire(import.meta.url)
const toSJIS = require('./to-sjis.cjs') as typeof toSJISModule
const qrGlobal = (globalThis as { QRCode?: { toSJIS?: typeof toSJIS } }).QRCode

if (!qrGlobal) {
  throw new ReferenceError('QRCode is not defined')
}

qrGlobal.toSJIS = toSJIS

export default toSJIS
