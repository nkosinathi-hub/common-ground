import { success, type Outcome } from "../http/outcome.ts"
import { moviesWatched, showsWatched, type Watch } from "./history.ts"
import { failure, simklFailure } from "./outcome.ts"
import type { SimklStore } from "./ports.ts"
import type { ItemKind, SimklClient, SimklResult } from "./simkl-client.ts"

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
 * the cursor. The cursor advances to the activities time only once every read succeeded.
 */
export async function syncUser(
  deps: { client: SimklClient; store: SimklStore; clock: () => Date },
  userId: string,
): Promise<Outcome<SyncResult>> {
  const { client, store, clock } = deps
  const link = await store.link(userId)
  if (!link) return failure("not_found")
  const refused = async (result: SimklResult & { ok: false }) => {
    if (result.failure !== "unauthorized") return simklFailure(result.failure)
    await store.remove(userId)
    return failure("denied")
  }
  const activities = await client.activities(link.token)
  if (!activities.ok) return refused(activities)
  const body = asObject(activities.body)
  const latest = typeof body.all === "string" ? body.all : null
  const cursor = timeOf(link.cursor)
  const watches: Watch[] = []
  for (const [kind, bucket, read] of KINDS) {
    if (!moved(body, bucket, cursor)) continue
    const items = await client.allItems(link.token, kind, simklTime(link.cursor))
    if (!items.ok) return refused(items)
    watches.push(...read(items.body))
  }
  const added = await store.importWatches(userId, watches, latest)
  return success({ added, lastSyncedAt: clock().toISOString() })
}
