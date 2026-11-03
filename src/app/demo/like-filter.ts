/** The literal/wildcard subset of Postgres ILIKE, including escaped %, _ and quoted values. */
export function like(value: unknown, raw: string): boolean {
  const pattern =
    raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1).replace(/\\([\\"])/g, "$1") : raw
  const escape = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  let expression = ""
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!
    if (c === "\\" && i + 1 < pattern.length) expression += escape(pattern[++i]!)
    else expression += c === "%" ? "[\\s\\S]*" : c === "_" ? "[\\s\\S]" : escape(c)
  }
  return new RegExp(`^${expression}$`, "iu").test(typeof value === "string" ? value : "")
}
