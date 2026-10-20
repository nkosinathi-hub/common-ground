/** The signed-in user's Simkl link; the access token never reaches the browser. */
export interface SimklLink {
  readonly connectedAt: string
  readonly lastSyncedAt: string | null
}

/** A PIN sign-in in progress: the code to enter on Simkl, and how long and how often to poll. */
export interface PinStart {
  readonly userCode: string
  readonly verificationUrl: string
  readonly expiresIn: number
  readonly interval: number
}

export interface SyncResult {
  readonly added: number
  readonly lastSyncedAt: string
}
