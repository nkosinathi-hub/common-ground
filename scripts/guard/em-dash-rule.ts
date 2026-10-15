const EM_DASH = "—"

export interface DashHit {
  readonly path: string
  readonly line: number
}

export function findEmDashes(files: readonly { path: string; text: string }[]): DashHit[] {
  return files.flatMap((file) =>
    file.text
      .split("\n")
      .flatMap((text, index) => (text.includes(EM_DASH) ? [{ path: file.path, line: index + 1 }] : [])),
  )
}
