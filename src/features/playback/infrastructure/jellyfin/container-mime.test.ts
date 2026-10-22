import { describe, expect, it } from "vitest"
import { containerMime } from "./container-mime"

describe("containerMime", () => {
  it("reads Jellyfin's ffmpeg demuxer list for an MP4 file as video/mp4", () => {
    // Found against a real Jellyfin 12.2: an .mp4 reports this list, and video/mov stops shaka.
    expect(containerMime("mov,mp4,m4a,3gp,3g2,mj2")).toBe("video/mp4")
    expect(containerMime("mp4")).toBe("video/mp4")
    expect(containerMime("m4v")).toBe("video/mp4")
  })

  it("keeps WebM, names Matroska, and assumes MP4 when nothing is said", () => {
    expect(containerMime("webm")).toBe("video/webm")
    expect(containerMime("mkv")).toBe("video/x-matroska")
    expect(containerMime("matroska,webm")).toBe("video/webm")
    expect(containerMime(undefined)).toBe("video/mp4")
  })
})
