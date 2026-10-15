export interface Toolchain {
  readonly node: string
  readonly pnpm: string
}

/** Reads the pinned toolchain from .mise.toml (`node = "24"`, `"npm:pnpm" = "10.34.3"`). */
export function parseMise(text: string): Toolchain {
  const read = (key: RegExp) => key.exec(text)?.[1] ?? ""
  return { node: read(/^node\s*=\s*"([^"]+)"/m), pnpm: read(/^"npm:pnpm"\s*=\s*"([^"]+)"/m) }
}

const parts = (version: string) => version.replace(/^v/, "").split(".").map(Number)

/** Same major as the pin, and not older than any component the pin specifies. */
export function satisfies(actual: string, required: string): boolean {
  const have = parts(actual)
  const want = parts(required)
  if (have[0] !== want[0]) return false
  for (let i = 1; i < want.length; i++) {
    const a = have[i] ?? 0
    const w = want[i] ?? 0
    if (a !== w) return a > w
  }
  return true
}

export function checkVersions(actual: Toolchain, required: Toolchain): string[] {
  return (["node", "pnpm"] as const)
    .filter((tool) => !satisfies(actual[tool], required[tool]))
    .map((tool) => `${tool} ${actual[tool]} does not satisfy ${required[tool]} (run: mise install)`)
}
