import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import { requestJson } from "../http"

export interface ArchiveEndpoints {
  /** Wikidata's SPARQL endpoint. */
  readonly wikidata: string
  /** archive.org: metadata, downloads and embeds. */
  readonly archive: string
  /** Where downloads land after archive.org's redirect to a storage node. */
  readonly media: readonly string[]
}

const IMDB = /^tt\d{7,10}$/
const ARCHIVE_ID = /^[A-Za-z0-9._-]{1,100}$/
/** Public-domain marks and dedications, and Creative Commons licences; nothing implied. */
const OPEN_LICENCE = /^https?:\/\/creativecommons\.org\/(publicdomain|licenses)\//i

const none = (why: string) => err(appError("not_found", why))

/** IMDb id to Internet Archive ids through Wikidata: films with P345 (IMDb) and P724 (archive). */
export async function archiveIds(
  fetcher: typeof fetch,
  endpoints: ArchiveEndpoints,
  imdbId: string,
  signal: AbortSignal,
): Promise<Result<string[]>> {
  if (!IMDB.test(imdbId)) return none("No IMDb id for this title")
  const query = `SELECT ?ia WHERE { ?film wdt:P345 "${imdbId}" ; wdt:P724 ?ia . }`
  const url = `${endpoints.wikidata}?format=json&query=${encodeURIComponent(query)}`
  const reply = await requestJson(fetcher, { url, signal })
  if (!reply.ok) return reply
  const bindings = (reply.value as { results?: { bindings?: unknown } } | null)?.results?.bindings
  const ids = (Array.isArray(bindings) ? bindings : [])
    .map((b) => (b as { ia?: { value?: unknown } }).ia?.value)
    .filter((id): id is string => typeof id === "string" && ARCHIVE_ID.test(id))
  return ids.length ? ok(ids) : none("Not on the Internet Archive")
}

export interface ArchiveItem {
  readonly id: string
  readonly mp4: string | null
}

/** An item's licence and its MP4 file; refused unless the licence is explicitly open. */
export async function openItem(
  fetcher: typeof fetch,
  endpoints: ArchiveEndpoints,
  id: string,
  signal: AbortSignal,
): Promise<Result<ArchiveItem>> {
  const reply = await requestJson(fetcher, { url: `${endpoints.archive}/metadata/${id}`, signal })
  if (!reply.ok) return reply
  const body = reply.value as { metadata?: { licenseurl?: unknown }; files?: unknown } | null
  const licence = body?.metadata?.licenseurl
  if (typeof licence !== "string" || !OPEN_LICENCE.test(licence))
    return none("No explicit public-domain or Creative Commons licence")
  const files = Array.isArray(body?.files)
    ? (body.files as { name?: unknown; format?: unknown }[])
    : []
  const mp4 = files.find((f) => typeof f.name === "string" && /\.mp4$/i.test(f.name))
  return ok({ id, mp4: typeof mp4?.name === "string" ? mp4.name : null })
}
