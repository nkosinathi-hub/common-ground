import { describe, expect, it, vi } from "vitest"
import type shaka from "shaka-player"
import { shakaTracks } from "./shaka-tracks"

function setup() {
  const audio = [
    { id: 1, language: "es", label: "Spanish", active: true },
    { id: 2, language: "eng", label: "English", active: false },
  ]
  const text = [{ id: 4, language: "en", label: "English CC", active: false }]
  const player = {
    getAudioTracks: () => audio,
    getTextTracks: () => text,
    selectAudioTrack: vi.fn(),
    selectTextTrack: vi.fn(),
    addTextTrackAsync: vi.fn(async () => ({ id: 5 })),
    destroy: vi.fn(),
  }
  return { player, audio, text, handle: shakaTracks(player as unknown as shaka.Player) }
}

describe("Shaka language and text selection", () => {
  it("selects English explicitly even when Spanish is the stream default", () => {
    const { handle, player, audio } = setup()
    handle.setAudio("en")
    expect(player.selectAudioTrack).toHaveBeenCalledWith(audio[1])
    handle.setAudio("en", "1")
    expect(player.selectAudioTrack).toHaveBeenCalledTimes(1) // Already active Spanish.
    expect(handle.tracks().audio.map((a) => a.label)).toEqual(["Spanish", "English"])
  })
  it("selects text by ID, hides it, and adds device-local VTT", async () => {
    const { handle, player, text } = setup()
    handle.setCaptions(true, null, "4")
    expect(player.selectTextTrack).toHaveBeenLastCalledWith(text[0])
    handle.setCaptions(false, null)
    expect(player.selectTextTrack).toHaveBeenLastCalledWith(null)
    expect(
      await handle.addSubtitle({ url: "blob:local", language: "en", label: "Own captions" }),
    ).toBe("5")
    handle.destroy()
    expect(player.destroy).toHaveBeenCalledOnce()
  })
})
