export type ParsedVersion = {
  major: number
  minor: number
  patch: number
  raw: string
}

export declare const parseVersion: (
  value: unknown,
  label?: string,
) => ParsedVersion

export declare const computeMainVersion: (currentVersion: unknown) => string

export declare const compareVersions: (
  left: ParsedVersion,
  right: ParsedVersion,
) => number

export declare const computeBetaVersion: (options: {
  currentVersion: unknown
  npmLatestVersion?: unknown
  npmBetaVersion?: unknown
  mainVersion?: unknown
  runNumber?: unknown
  runAttempt?: unknown
}) => string
