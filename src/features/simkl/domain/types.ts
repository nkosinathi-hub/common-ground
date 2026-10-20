/** The signed-in user's Simkl link; the access token never reaches the browser. */
export interface SimklLink {
  readonly connectedAt: string
  readonly lastSyncedAt: string | null
}

/**
 * A device sign-in in progress (Simkl AUTH V2): the page that approves it with the code filled
 * in, the code and plain page as a fallback, and how long and how often to poll.
 */
export interface PinStart {
  readonly userCode: string
  readonly verificationUri: string
  readonly verificationUriComplete: string
  readonly expiresIn: number
  readonly interval: number
}

/** One poll: still pending (at this interval, grown on slow down), connected, or expired. */
export type PollStatus =
  | { readonly status: "pending"; readonly interval: number }
  | { readonly status: "connected" }
  | { readonly status: "expired" }

export interface SyncResult {
  readonly added: number
  readonly lastSyncedAt: string
}
