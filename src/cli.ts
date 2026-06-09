#!/usr/bin/env node
import { createRequire } from 'node:module'
import process from 'node:process'
import { cli } from 'cleye'

import { toFile, toString, type QRRenderOptions } from './index.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json') as { version: string }

const outputTypes = ['png', 'svg', 'utf8'] as const
const errorLevels = ['L', 'M', 'Q', 'H'] as const

function fail(message: string): never {
  console.error(`Error: ${message}`)
  process.exit(1)
}

function validateChoice<T extends string>(
  value: string | undefined,
  choices: readonly T[],
  label: string,
): T | undefined {
  if (typeof value === 'undefined') return undefined
  if ((choices as readonly string[]).includes(value)) return value as T
  fail(`${label} must be one of: ${choices.join(', ')}`)
}

function buildOptions(flags: ParsedFlags): QRRenderOptions {
  const type = validateChoice(flags.type, outputTypes, 'Output type')
  const errorCorrectionLevel = validateChoice(
    flags.error,
    errorLevels,
    'Error correction level',
  )

  return {
    version: flags.qversion,
    errorCorrectionLevel,
    type,
    small: flags.small,
    inverse: flags.inverse,
    maskPattern: flags.mask,
    margin: flags.qzone,
    width: flags.width,
    scale: flags.scale,
    color: {
      light: flags.lightcolor,
      dark: flags.darkcolor,
    },
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk: string) => {
      text += chunk
    })
    process.stdin.on('error', reject)
    process.stdin.on('end', () => {
      resolve(text)
    })
  })
}

async function getInput(args: string[]): Promise<string> {
  if (args.length > 0) return args.join(' ')
  if (process.stdin.isTTY) return ''

  const stdin = await readStdin()
  return stdin
}

async function main() {
  const argv = cli({
    name: 'qrcode',
    version: pkg.version,
    parameters: ['[input...]'],
    help: {
      description:
        'Generate QR codes in the terminal or save png/svg/utf8 output to a file.',
      examples: [
        '"some text"',
        '-o out.png "some text"',
        '-t svg -o out.svg "some text"',
        '-d F00 -o out.png "some text"',
      ],
    },
    flags: {
      qversion: {
        type: Number,
        alias: 'v',
        description: 'QR Code symbol version (1 - 40)',
      },
      error: {
        type: String,
        alias: 'e',
        description: 'Error correction level: L, M, Q, or H',
      },
      mask: {
        type: Number,
        alias: 'm',
        description: 'Mask pattern (0 - 7)',
      },
      type: {
        type: String,
        alias: 't',
        description: 'Output type: png, svg, or utf8',
      },
      inverse: {
        type: Boolean,
        alias: 'i',
        description: 'Invert terminal colors',
      },
      width: {
        type: Number,
        alias: 'w',
        description: 'Image width in px',
      },
      scale: {
        type: Number,
        alias: 's',
        description: 'Scale factor',
      },
      qzone: {
        type: Number,
        alias: 'q',
        description: 'Quiet zone size',
      },
      lightcolor: {
        type: String,
        alias: 'l',
        description: 'Light RGBA hex color',
      },
      darkcolor: {
        type: String,
        alias: 'd',
        description: 'Dark RGBA hex color',
      },
      small: {
        type: Boolean,
        description: 'Output a smaller QR code to terminal',
      },
      output: {
        type: String,
        alias: 'o',
        description: 'Output file path',
      },
    },
  })

  if (
    typeof argv.flags.width !== 'undefined' &&
    typeof argv.flags.scale !== 'undefined'
  ) {
    fail('Use either --width or --scale, not both')
  }

  if (argv.flags.small && argv.flags.type) {
    fail('Use either --small or --type, not both')
  }

  const text = await getInput(argv._)
  if (text.length === 0) {
    argv.showHelp()
    process.exit(1)
  }

  const options = buildOptions(argv.flags)

  try {
    if (argv.flags.output) {
      await toFile(argv.flags.output, text, options)
      console.log(`saved qrcode to: ${argv.flags.output}\n`)
    } else {
      const rendered = await toString(text, { ...options, type: 'terminal' })
      console.log(rendered)
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }
}

type ParsedFlags = {
  qversion?: number
  error?: string
  mask?: number
  type?: string
  inverse?: boolean
  width?: number
  scale?: number
  qzone?: number
  lightcolor?: string
  darkcolor?: string
  small?: boolean
  output?: string
}

await main()
