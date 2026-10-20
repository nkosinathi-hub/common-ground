import type { DeviceStore } from "@/shared/domain"

export interface CaptionChoice {
  readonly on: boolean
  readonly language: string | null
}

const KEY = "playback-captions"
const OFF: CaptionChoice = { on: false, language: null }

/** Captions on or off and the language, remembered for this person on this device. */
export function captionPreference(store: DeviceStore) {
  return {
    read(): CaptionChoice {
      try {
        const value = JSON.parse(store.read(KEY) ?? "null") as Partial<CaptionChoice> | null
        if (typeof value?.on !== "boolean") return OFF
        const language = typeof value.language === "string" ? value.language : null
        return { on: value.on, language }
      } catch {
        return OFF
      }
    },
    write(choice: CaptionChoice): void {
      store.write(KEY, JSON.stringify(choice))
    },
  }
}
