import { getContext, setContext } from "svelte"
import type { DeviceStore } from "@/shared/domain"
import type { PlaybackService } from "../application/playback-service"
import type { ProviderAccount } from "../application/ports"

export interface PlaybackContext {
  readonly service: PlaybackService
  /** Where this person's caption choice is remembered. */
  readonly device: DeviceStore
  /** The signed-in media server account (Jellyfin) when the build has one. */
  readonly account: ProviderAccount | null
}

const KEY = Symbol("playback")

export function providePlayback(value: PlaybackContext): void {
  setContext(KEY, value)
}

export function usePlayback(): PlaybackContext {
  const value = getContext<PlaybackContext | undefined>(KEY)
  if (!value) throw new Error("Playback is not provided: call providePlayback in composition")
  return value
}
