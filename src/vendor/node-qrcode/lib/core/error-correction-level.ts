export interface ErrorCorrectionLevel {
  bit: number
}

export const L: ErrorCorrectionLevel = { bit: 1 }
export const M: ErrorCorrectionLevel = { bit: 0 }
export const Q: ErrorCorrectionLevel = { bit: 3 }
export const H: ErrorCorrectionLevel = { bit: 2 }

function fromString(string: unknown): ErrorCorrectionLevel {
  if (typeof string !== 'string') {
    throw new Error('Param is not a string')
  }

  const lcStr = string.toLowerCase()

  switch (lcStr) {
    case 'l':
    case 'low':
      return L
    case 'm':
    case 'medium':
      return M
    case 'q':
    case 'quartile':
      return Q
    case 'h':
    case 'high':
      return H
    default:
      throw new Error('Unknown EC Level: ' + string)
  }
}

export function isValid(level: unknown): level is ErrorCorrectionLevel {
  const maybeLevel = level as Partial<ErrorCorrectionLevel> | null | undefined

  return Boolean(
    maybeLevel &&
      typeof maybeLevel.bit !== 'undefined' &&
      maybeLevel.bit >= 0 &&
      maybeLevel.bit < 4,
  )
}

export function from(
  value: unknown,
  defaultValue?: ErrorCorrectionLevel,
): ErrorCorrectionLevel | undefined {
  if (isValid(value)) {
    return value
  }

  try {
    return fromString(value)
  } catch {
    return defaultValue
  }
}

export default {
  from,
  H,
  isValid,
  L,
  M,
  Q,
}
