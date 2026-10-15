export const MAX_LINES = 100

const EXEMPT = [
  /^pnpm-lock\.yaml$/,
  /(^|\/)database\.types\.ts$/,
  /^supabase\/config\.toml$/,
  /\.(svg|png|jpg|jpeg|webp|ico|pdf|woff2?)$/,
]

export const isExempt = (path: string): boolean => EXEMPT.some((rule) => rule.test(path))

export function countLines(text: string): number {
  if (text.length === 0) return 0
  const lines = text.split("\n")
  return lines.at(-1) === "" ? lines.length - 1 : lines.length
}

export interface LengthViolation {
  readonly path: string
  readonly lines: number
}

export function findLengthViolations(
  files: readonly { path: string; text: string }[],
): LengthViolation[] {
  return files
    .filter((file) => !isExempt(file.path))
    .map((file) => ({ path: file.path, lines: countLines(file.text) }))
    .filter((file) => file.lines > MAX_LINES)
}
