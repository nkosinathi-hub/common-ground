import type { Result } from "@/shared/domain"
import type { PinStart, PollStatus, SimklLink, SyncResult } from "../domain/types"

/** The caller's Simkl link (a row read) and the simkl Edge Function's actions. */
export interface SimklGateway {
  /** Null when the caller has not connected Simkl. */
  status(): Promise<Result<SimklLink | null>>
  startPin(): Promise<Result<PinStart>>
  /** `interval` is the current poll interval in seconds. */
  poll(interval: number): Promise<Result<PollStatus>>
  sync(): Promise<Result<SyncResult>>
  disconnect(): Promise<Result<void>>
}
