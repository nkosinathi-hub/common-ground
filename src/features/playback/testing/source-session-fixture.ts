import { fileSource } from "./render-player"
export const target = { spaceId: "s", itemId: "i", catalog: { type: "movie", id: 603 } } as const
export const first = fileSource("https://example.org/a.mp4")
export const second = fileSource("https://example.org/b.mp4")
export const ref = { kind: "movie", tmdbId: 603 } as const
