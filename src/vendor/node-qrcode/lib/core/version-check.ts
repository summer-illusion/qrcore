export function isValid(version: number | string): boolean {
  const numericVersion = Number(version)
  return (
    !Number.isNaN(numericVersion) &&
    numericVersion >= 1 &&
    numericVersion <= 40
  )
}

export default {
  isValid,
}
