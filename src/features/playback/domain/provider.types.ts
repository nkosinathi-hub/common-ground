import type { Result } from "../../../shared/domain/result"
import type { MediaRef } from "./media-ref"
import type { PlayableSource } from "./source.types"

/** Track and bitrate choices; changing a track is a new resolve, not a player switch. */
export interface PlaybackPrefs {
  readonly audioIndex?: number
  readonly subtitleIndex?: number
  readonly maxBitrate?: number
}

export type PlaybackEventKind = "start" | "progress" | "stop"

export interface PlaybackEvent {
  readonly kind: PlaybackEventKind
  readonly source: PlayableSource
  readonly positionSeconds: number
  readonly paused: boolean
  /** Sent with fetch keepalive, so it survives the page going away. */
  readonly keepalive: boolean
}

/** One configured instance of a plugin. The core knows only this interface. */
export interface Provider {
  readonly id: string
  supports(ref: MediaRef): boolean
  resolve(
    ref: MediaRef,
    signal: AbortSignal,
    prefs?: PlaybackPrefs,
  ): Promise<Result<PlayableSource[]>>
  health(signal: AbortSignal): Promise<Result<void>>
  /** Progress back to the provider, when it keeps its own (Jellyfin resume points). */
  report?(event: PlaybackEvent): Promise<void>
}

export interface ProviderConfig {
  readonly type: string
  readonly id: string
  readonly enabled: boolean
  /** Lower runs first: 1 is the most preferred provider. */
  readonly priority: number
  readonly timeoutMs: number
  readonly retries: number
  readonly options: unknown
}

export type ErrorClass = "transient" | "permanent" | "auth"
