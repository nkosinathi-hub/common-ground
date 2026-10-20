import type { Watch } from "./history.ts"

/** A user's Simkl link as the function sees it; the token never leaves the function. */
export interface SimklLink {
  readonly token: string
  /** The Simkl activities time of the last import, as Postgres returns a timestamptz. */
  readonly cursor: string | null
}

/** public.simkl_links and public.import_simkl_watches through the service-role client. */
export interface SimklStore {
  link(userId: string): Promise<SimklLink | null>
  /** Creates or replaces the link with a fresh token; the cursor starts over. */
  save(userId: string, token: string): Promise<void>
  /** Adds the watches not yet recorded, advances the cursor; returns how many were added. */
  importWatches(userId: string, watches: readonly Watch[], cursor: string | null): Promise<number>
  remove(userId: string): Promise<void>
}
