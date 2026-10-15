const LINE = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/

/** KEY=VALUE pairs of a dotenv file; comments and blank lines are skipped. */
export function parseEnv(text: string): Map<string, string> {
  const entries = text.split("\n").flatMap((line) => {
    if (line.trimStart().startsWith("#")) return []
    const match = LINE.exec(line)
    return match ? [[match[1]!, match[2]!.trim()] as [string, string]] : []
  })
  return new Map(entries)
}

export interface Merged {
  readonly text: string
  readonly added: string[]
}

/**
 * Adds keys from .env.example that .env lacks. Existing lines are never rewritten; missing keys
 * are appended. Overrides replace the example value, but only for keys being added.
 */
export function mergeEnv(
  example: string,
  current: string | null,
  overrides: Record<string, string> = {},
): Merged {
  const wanted = parseEnv(example)
  const have = parseEnv(current ?? "")
  const added = [...wanted.keys()].filter((key) => !have.has(key))
  const value = (key: string) => overrides[key] ?? wanted.get(key) ?? ""
  if (current === null) {
    const text = example
      .split("\n")
      .map((line) => {
        const key = LINE.exec(line)?.[1]
        return key && !line.trimStart().startsWith("#") ? `${key}=${value(key)}` : line
      })
      .join("\n")
    return { text, added }
  }
  if (added.length === 0) return { text: current, added }
  const base = current.endsWith("\n") || current === "" ? current : `${current}\n`
  const lines = added.map((key) => `${key}=${value(key)}`)
  return { text: `${base}# added by pnpm setup\n${lines.join("\n")}\n`, added }
}
