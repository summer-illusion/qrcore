export type VersionLineCheckOptions = {
  currentVersion: unknown
  baseVersion: unknown
  currentLabel?: string
  baseLabel?: string
}

export type VersionLineCheckResult = {
  currentLine: string
  baseLine: string
}

export declare const assertSameVersionLine: (
  options: VersionLineCheckOptions,
) => VersionLineCheckResult
