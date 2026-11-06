import type { DeviceStore } from "@/shared/domain"

export const PLAYBACK_PREFERENCES = [
  { key: "playback-auto-intro", label: "Automatically skip intros", default: true },
  { key: "playback-auto-next", label: "Automatically play the next episode", default: true },
] as const

export const playbackPreference = (device: DeviceStore, key: string) => device.read(key) !== "false"
