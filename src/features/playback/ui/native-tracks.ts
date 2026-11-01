import { languageCode } from "../domain/language"
import type { EngineHandle } from "./media-tracks"

interface AudioTrack {
  id: string
  language: string
  label: string
  enabled: boolean
}
type AudioVideo = HTMLVideoElement & { audioTracks?: ArrayLike<AudioTrack> }

/** Safari exposes native multi-audio tracks; other file players still expose text tracks. */
export function nativeTracks(video: AudioVideo): EngineHandle {
  const audio = () => Array.from(video.audioTracks ?? [])
  const text = () => Array.from(video.textTracks)
  let uploaded: HTMLTrackElement | null = null
  return {
    tracks: () => ({
      audio: audio().map((t, i) => ({
        id: t.id || String(i),
        language: t.language,
        label: t.label || t.language || "Unknown",
        active: t.enabled,
      })),
      text: text().map((t, i) => ({
        id: t.id || String(i),
        language: t.language,
        label: t.label || t.language || "Subtitles",
        active: t.mode === "showing",
      })),
    }),
    setAudio: (language, id) => {
      const tracks = audio()
      const chosen = id
        ? tracks.find((t, i) => (t.id || String(i)) === id)
        : tracks.find((t) => languageCode(t.language) === languageCode(language))
      if (chosen) for (const track of tracks) track.enabled = track === chosen
    },
    setCaptions: (on, language, id) => {
      const tracks = text()
      const chosen =
        (id
          ? tracks.find((t, i) => (t.id || String(i)) === id)
          : tracks.find((t) => languageCode(t.language) === languageCode(language ?? "en"))) ??
        tracks[0]
      for (const track of tracks) track.mode = on && track === chosen ? "showing" : "hidden"
    },
    addSubtitle: async (track) => {
      uploaded?.remove()
      uploaded = document.createElement("track")
      Object.assign(uploaded, {
        id: "uploaded-subtitles",
        kind: "subtitles",
        src: track.url,
        srclang: track.language,
        label: track.label,
      })
      video.append(uploaded)
      return "uploaded-subtitles"
    },
    destroy: () => uploaded?.remove(),
  }
}
