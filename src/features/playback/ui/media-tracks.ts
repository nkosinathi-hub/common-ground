import type { Subtitle } from "../domain/source.types"

export interface MediaTrack {
  readonly id: string
  readonly language: string
  readonly label: string
  readonly active: boolean
}

export interface EngineHandle {
  tracks(): { audio: MediaTrack[]; text: MediaTrack[] }
  setAudio(language: string, id?: string): void
  setCaptions(on: boolean, language: string | null, id?: string): void
  addSubtitle: (track: Subtitle) => Promise<string>
  destroy(): void
}

export const EMPTY_TRACKS = { audio: [], text: [] }
