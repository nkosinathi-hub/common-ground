import { isUuid } from "../http/request.ts"
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

type Parsed = { ok: true; value: CatalogRequest } | { ok: false; message: string }

const MAX_ID = 2147483647
const QUERY = { min: 2, max: 160 }
const PAGES = { min: 1, max: 20 }

const fail = (message: string): Parsed => ({ ok: false, message })

/** TMDB ids arrive as numbers or digit strings; anything else is not an id. */
function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value)
  return NaN
}

function parseId(value: unknown): number | null {
  const id = toNumber(value)
  return Number.isSafeInteger(id) && id > 0 && id <= MAX_ID ? id : null
}

function parseSearch(body: Record<string, unknown>, spaceId: string): Parsed {
  const query = typeof body.q === "string" ? body.q.trim() : ""
  if (query.length < QUERY.min || query.length > QUERY.max)
    return fail(`Search with ${QUERY.min} to ${QUERY.max} characters`)
  const page = body.page ?? PAGES.min
  if (typeof page !== "number" || !Number.isInteger(page) || page < PAGES.min || page > PAGES.max)
    return fail(`Choose a page from ${PAGES.min} to ${PAGES.max}`)
  return { ok: true, value: { action: "search", spaceId, query, page } }
}

export function parseRequest(raw: unknown): Parsed {
  if (typeof raw !== "object" || raw === null) return fail("Invalid request")
  const body = raw as Record<string, unknown>
  if (!isUuid(body.spaceId)) return fail("Choose a space first")
  const spaceId = body.spaceId
  if (body.action === "search") return parseSearch(body, spaceId)
  if (body.action !== "details" && body.action !== "refresh") return fail("Unknown catalog action")
  const id = parseId(body.id)
  if ((body.type !== "movie" && body.type !== "tv") || id === null)
    return fail("Choose a valid movie or series")
  return { ok: true, value: { action: body.action, spaceId, type: body.type, id } }
}
