import type shaka from "shaka-player"
import { languageCode } from "../domain/language"
import type { EngineHandle, MediaTrack } from "./media-tracks"

/** Track choices use Shaka's own IDs, including embedded and user-supplied text tracks. */
export function shakaTracks(player: shaka.Player): EngineHandle {
  const describe = (
    track: { id?: number; language: string; label: string | null; active: boolean },
    i: number,
  ): MediaTrack => ({
    id: String(track.id ?? i),
    language: track.language,
    label: track.label || track.language || "Unknown",
    active: track.active,
  })
  return {
    tracks: () => ({
      audio: player.getAudioTracks().map(describe),
      text: player.getTextTracks().map(describe),
    }),
    setAudio: (language, id) => {
      const tracks = player.getAudioTracks()
      const chosen = id
        ? tracks.find((t) => String(t.id) === id)
        : tracks.find((t) => languageCode(t.language) === languageCode(language))
      if (chosen && !chosen.active) player.selectAudioTrack(chosen)
    },
    setCaptions: (on, language, id) => {
      const tracks = player.getTextTracks()
      const chosen =
        (id
          ? tracks.find((t) => String(t.id) === id)
          : tracks.find((t) => languageCode(t.language) === languageCode(language ?? "en"))) ??
        tracks[0] ??
        null
      player.selectTextTrack(on ? chosen : null)
    },
    addSubtitle: async (track) => {
      const added = await player.addTextTrackAsync(
        track.url,
        track.language,
        "subtitles",
        "text/vtt",
        undefined,
        track.label,
      )
      return String(added.id)
    },
    destroy: () => void player.destroy(),
  }
}
