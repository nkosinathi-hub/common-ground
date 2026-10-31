import type { DemoRow } from "./tables"

const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? `${value}`
    : ""

/** Numbers compare as numbers, everything else as text. */
function compare(value: unknown, raw: string): number {
  const wanted = raw.replace(/^"|"$/g, "")
  if (typeof value === "number" && wanted !== "" && !Number.isNaN(Number(wanted)))
    return value - Number(wanted)
  return text(value).localeCompare(wanted)
}

/** One PostgREST condition on a column: eq, neq, lt, lte, gt, gte, is, not.is, in, ilike. */
export function matches(value: unknown, filter: string): boolean {
  if (filter === "is.null") return value == null
  if (filter === "not.is.null") return value != null
  if (filter.startsWith("in.(")) return filter.slice(4, -1).split(",").includes(text(value))
  if (filter.startsWith("ilike."))
    return text(value).toLowerCase().includes(filter.slice(6).replaceAll("%", "").toLowerCase())
  const [op, ...rest] = filter.split(".")
  const wanted = rest.join(".")
  if (op === "eq") return value != null && compare(value, wanted) === 0
  if (op === "neq") return compare(value, wanted) !== 0
  if (value == null) return false
  if (op === "lt") return compare(value, wanted) < 0
  if (op === "lte") return compare(value, wanted) <= 0
  if (op === "gt") return compare(value, wanted) > 0
  if (op === "gte") return compare(value, wanted) >= 0
  return true
}

/** Splits on commas that are not inside parentheses or quotes. */
function terms(list: string): string[] {
  const out: string[] = []
  let depth = 0
  let quoted = false
  let start = 0
  for (let i = 0; i < list.length; i++) {
    const c = list[i]
    if (c === '"') quoted = !quoted
    else if (!quoted && c === "(") depth++
    else if (!quoted && c === ")") depth--
    else if (!quoted && depth === 0 && c === ",") {
      out.push(list.slice(start, i))
      start = i + 1
    }
  }
  return [...out, list.slice(start)]
}

/** A term of an `or=(…)` list: `and(…)` or `column.op.value`. */
function holds(row: DemoRow, term: string): boolean {
  if (term.startsWith("and(")) return terms(term.slice(4, -1)).every((t) => holds(row, t))
  const dot = term.indexOf(".")
  return matches(row[term.slice(0, dot)], term.slice(dot + 1))
}

/** `or=(a,and(b,c))`: true when any term holds. */
export const anyOf = (row: DemoRow, filter: string) =>
  terms(filter.replace(/^\(|\)$/g, "")).some((t) => holds(row, t))
