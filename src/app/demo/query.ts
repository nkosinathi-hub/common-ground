import type { DemoRow } from "./tables"

const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? `${value}`
    : ""

/** The small read-only PostgREST subset used by production adapters in the sample space. */
export function selectRows(rows: DemoRow[], params: URLSearchParams): DemoRow[] {
  let result = rows.filter((row) =>
    [...params].every(([column, filter]) => {
      if (
        ["select", "order", "limit", "offset", "or", "and"].includes(column) ||
        column.includes(".")
      )
        return true
      const value = row[column]
      if (filter.startsWith("eq.")) return text(value) === filter.slice(3)
      if (filter.startsWith("is.")) return text(value) === filter.slice(3)
      if (filter === "not.is.null") return value != null
      if (filter.startsWith("in.(")) return filter.slice(4, -1).split(",").includes(text(value))
      if (filter.startsWith("ilike."))
        return text(value).toLowerCase().includes(filter.slice(6).replaceAll("%", "").toLowerCase())
      if (filter.startsWith("gte.")) return text(value) >= filter.slice(4)
      if (filter.startsWith("lte.")) return text(value) <= filter.slice(4)
      if (filter.startsWith("neq.")) return text(value) !== filter.slice(4)
      return true
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
