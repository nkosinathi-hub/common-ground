import type { Watch } from "./history.ts"

/** A user's simkl_links row as the function sees it. None of it ever reaches the browser. */
export interface SimklLink {
  /** Null while the sign-in is pending. */
  readonly accessToken: string | null
  readonly refreshToken: string | null
  readonly accessExpiresAt: string | null
  readonly deviceCode: string | null
  readonly deviceExpiresAt: string | null
  /** The Simkl activities time of the last import, as Postgres returns a timestamptz. */
  readonly cursor: string | null
}

export interface SimklTokens {
  readonly accessToken: string
  readonly refreshToken: string
  readonly accessExpiresAt: string
}

/** public.simkl_links and its functions through the service-role client. */
export interface SimklStore {
  link(userId: string): Promise<SimklLink | null>
  /** Starts (or restarts) a pending sign-in with a device code that expires at `expiresAt`. */
  startDevice(userId: string, deviceCode: string, expiresAt: string): Promise<void>
  clearDevice(userId: string): Promise<void>
  /** Stores tokens, clears the device code and the refresh lease; `connect` marks it linked. */
  saveTokens(userId: string, tokens: SimklTokens, connect: boolean): Promise<void>
  /** Takes the per-user refresh lease (public.claim_simkl_refresh); false while another holds it. */
  claimRefresh(userId: string): Promise<boolean>
  releaseRefresh(userId: string): Promise<void>
  /** Adds the watches not yet recorded, advances the cursor; returns how many were added. */
  importWatches(userId: string, watches: readonly Watch[], cursor: string | null): Promise<number>
  remove(userId: string): Promise<void>
}
