import { anyOf, matches } from "./query-filter"
import type { DemoRow } from "./tables"

const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? `${value}`
    : ""

/** The small read-only PostgREST subset used by production adapters in the sample space. */
export function selectRows(rows: DemoRow[], params: URLSearchParams): DemoRow[] {
  let result = rows.filter((row) =>
    [...params].every(([column, filter]) => {
      if (column === "or") return anyOf(row, filter)
      if (["select", "order", "limit", "offset", "and"].includes(column) || column.includes("."))
        return true
      return matches(row[column], filter)
    }),
  )
  const order = params.get("order")?.split(",") ?? []
  result = [...result].sort((a, b) => {
    for (const field of order) {
      const [key, direction] = field.split(".")
      const compared = text(a[key!]).localeCompare(text(b[key!]))
      if (compared) return direction === "desc" ? -compared : compared
    }
    return 0
  })
  const offset = Number(params.get("offset") ?? 0)
  return result.slice(offset, offset + Number(params.get("limit") ?? result.length))
}
