import { createRequire } from 'node:module'

import type * as ServerModule from './server.ts'

const require = createRequire(import.meta.url)
const server = require('./server.cjs') as typeof ServerModule

export default server
