import { success, type Outcome } from "../http/outcome.ts"
import type { SimklDeps } from "./deps.ts"
import { moviesWatched, showsWatched, type Watch } from "./history.ts"
import { failure, isInvalidClient, simklFailure } from "./outcome.ts"
import type { ItemKind, SimklResult } from "./simkl-client.ts"
import { accessToken } from "./tokens.ts"

export interface SyncResult {
  readonly added: number
  readonly lastSyncedAt: string
}

type Loose = Record<string, unknown>
const asObject = (v: unknown): Loose => (typeof v === "object" && v !== null ? (v as Loose) : {})
const timeOf = (v: unknown) => (typeof v === "string" ? Date.parse(v) : NaN)

/** Simkl wants date_from as it writes times: whole seconds, UTC, a Z suffix. */
const simklTime = (cursor: string | null) =>
  cursor ? new Date(cursor).toISOString().replace(/\.\d{3}Z$/, "Z") : null

/** The activity buckets of each item kind; /sync/activities names shows `tv_shows`. */
const KINDS: readonly [ItemKind, string, (body: unknown) => Watch[]][] = [
  ["shows", "tv_shows", showsWatched],
  ["movies", "movies", moviesWatched],
]

/** A kind needs fetching unless its bucket says nothing changed since the cursor. */
function moved(activities: Loose, bucket: string, cursor: number): boolean {
  if (Number.isNaN(cursor)) return true
  const at = timeOf(asObject(activities[bucket]).all ?? activities.all)
  return Number.isNaN(at) || at > cursor
}

/**
 * One import: read activities first (Simkl's sync rule), then only the kinds that moved since
 * the cursor. A 401 refreshes the token once and retries once. The cursor advances to the
 * activities time only once every read succeeded.
 */
export async function syncUser(deps: SimklDeps, userId: string): Promise<Outcome<SyncResult>> {
  const { client, store, clock } = deps
  const link = await store.link(userId)
  if (!link?.accessToken) return failure("not_found")
  const first = await accessToken(deps, userId, { ...link, accessToken: link.accessToken }, false)
  if (!first.ok) return first
  let { token, refreshed } = first.body
  /** One read; a 401 refreshes once and retries once, a second 401 ends the link. */
  async function call(read: (token: string) => Promise<SimklResult>): Promise<Outcome<unknown>> {
    let reply = await read(token)
    if (!reply.ok && reply.failure === "unauthorized" && !refreshed) {
      refreshed = true
      const fresh = await accessToken(deps, userId, { ...link!, accessToken: token }, true)
      if (!fresh.ok) return fresh
      token = fresh.body.token
      reply = await read(token)
    }
    if (reply.ok) return success(reply.body)
    if (reply.failure !== "unauthorized" || isInvalidClient(reply)) return simklFailure(reply)
    await store.remove(userId)
    return failure("denied")
  }
  const activities = await call((t) => client.activities(t))
  if (!activities.ok) return activities
  const body = asObject(activities.body)
  const latest = typeof body.all === "string" ? body.all : null
  const cursor = timeOf(link.cursor)
  const watches: Watch[] = []
  for (const [kind, bucket, read] of KINDS) {
    if (!moved(body, bucket, cursor)) continue
    const items = await call((t) => client.allItems(t, kind, simklTime(link.cursor)))
    if (!items.ok) return items
    watches.push(...read(items.body))
  }
  const added = await store.importWatches(userId, watches, latest)
  return success({ added, lastSyncedAt: clock().toISOString() })
}
