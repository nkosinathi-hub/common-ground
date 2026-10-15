import type { CatalogType } from "./types.ts"

export type CatalogRequest =
  | {
      readonly action: "search"
      readonly spaceId: string
      readonly query: string
      readonly page: number
    }
  | {
      readonly action: "details" | "refresh"
      readonly spaceId: string
      readonly type: CatalogType
      readonly id: number
    }

export type Parsed = { ok: true; value: CatalogRequest } | { ok: false; message: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_ID = 2147483647

const fail = (message: string): Parsed => ({ ok: false, message })

function parseId(value: unknown): number | null {
  const id =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : NaN
  return Number.isSafeInteger(id) && id > 0 && id <= MAX_ID ? id : null
}

function parseSearch(body: Record<string, unknown>, spaceId: string): Parsed {
  const query = typeof body.q === "string" ? body.q.trim() : ""
  if (query.length < 2 || query.length > 160) return fail("Search with 2 to 160 characters")
  const page = body.page ?? 1
  if (typeof page !== "number" || !Number.isInteger(page) || page < 1 || page > 20)
    return fail("Choose a page from 1 to 20")
  return { ok: true, value: { action: "search", spaceId, query, page } }
}

export function parseRequest(raw: unknown): Parsed {
  if (typeof raw !== "object" || raw === null) return fail("Invalid request")
  const body = raw as Record<string, unknown>
  const spaceId = typeof body.spaceId === "string" && UUID.test(body.spaceId) ? body.spaceId : null
  if (!spaceId) return fail("Choose a space first")
  if (body.action === "search") return parseSearch(body, spaceId)
  if (body.action !== "details" && body.action !== "refresh") return fail("Unknown catalog action")
  const id = parseId(body.id)
  if ((body.type !== "movie" && body.type !== "tv") || id === null)
    return fail("Choose a valid movie or series")
  return { ok: true, value: { action: body.action, spaceId, type: body.type, id } }
}
