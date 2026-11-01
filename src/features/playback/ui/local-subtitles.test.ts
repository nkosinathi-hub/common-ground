import { afterEach, describe, expect, it, vi } from "vitest"
import { LocalSubtitles } from "./local-subtitles"
import type { EngineHandle } from "./media-tracks"

afterEach(() => vi.restoreAllMocks())
const content = "1\n00:00:00,000 --> 00:00:01,000\nHello"
const file = (text = content): File =>
  ({ name: "own.srt", size: text.length, text: async () => text }) as File
const engine = () => ({ addSubtitle: vi.fn(async () => "track-1") }) as unknown as EngineHandle

describe("device-local subtitle lifecycle", () => {
  it("deduplicates repeated file selection and attachment, and revokes replaced URLs", async () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:local-subtitle")
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    const local = new LocalSubtitles()
    const handle = engine()
    await local.load(file())
    expect(await local.attach(handle)).toBe("track-1")
    await local.load(file())
    await local.attach(handle)
    expect(handle.addSubtitle).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledTimes(1)
    await local.load(file(content.replace("Hello", "Goodbye")))
    await local.attach(handle)
    expect(revoke).toHaveBeenCalledTimes(1)
    local.dispose()
    expect(revoke).toHaveBeenCalledTimes(2)
    expect(await local.attach(handle)).toBeNull()
  })

  it("rejects oversized and invalid files without contacting an engine", async () => {
    const local = new LocalSubtitles()
    await expect(local.load({ ...file(), size: 3 * 1024 * 1024 })).rejects.toThrow(/2 MB/)
    await expect(local.load(file("not subtitles"))).rejects.toThrow(/valid/)
  })
})
