import { json, type Handler } from "./fixture-server"

/** Video ids on the stand-in instance; the uuids are only shaped like PeerTube's. */
export const PT = {
  open: "00000000-0000-4000-8000-000000000001",
  unlicensed: "00000000-0000-4000-8000-000000000002",
  private: "00000000-0000-4000-8000-000000000003",
  stray: "00000000-0000-4000-8000-000000000004",
  episode: "00000000-0000-4000-8000-000000000005",
  failing: "00000000-0000-4000-8000-000000000006",
  slow: "00000000-0000-4000-8000-000000000007",
} as const

/** TMDB titles the tests configure, one per behaviour above (raw options, as config holds them). */
export const PT_TITLES = [
  { tmdbId: 10378, video: PT.open },
  { tmdbId: 45745, video: PT.unlicensed, licence: "https://creativecommons.org/licenses/by/3.0/" },
  { tmdbId: 2, video: PT.unlicensed },
  { tmdbId: 3, video: PT.private },
  { tmdbId: 4, video: PT.stray },
  { tmdbId: 5, video: PT.failing },
  { tmdbId: 6, video: PT.slow },
  { tmdbId: 1399, season: 1, episode: 2, episodeTmdbId: 63057, video: PT.episode },
]

const WEBVTT = "WEBVTT\n\n00:00.000 --> 00:01.000\nHello\n"

function video(origin: string, id: string, extra: Record<string, unknown> = {}) {
  return {
    uuid: id,
    shortUUID: `short${id.slice(-4)}`,
    isLive: false,
    privacy: { id: 1 },
    state: { id: 1 },
    licence: { id: 1 },
    streamingPlaylists: [
      { playlistUrl: `${origin}/media/hls/index.m3u8`, files: [{ resolution: { id: 720 } }] },
    ],
    files: [
      { fileUrl: `${origin}/media/sample.mp4`, resolution: { id: 360 } },
      { fileUrl: `${origin}/media/4k.mp4`, resolution: { id: 2160 } },
      { fileUrl: `${origin}/media/audio.mp4`, resolution: { id: 0 } },
    ],
    ...extra,
  }
}

/** PeerTube's video, caption and config endpoints as a real instance answers them. */
export function peertubeRoutes(origin: () => string): Record<string, Handler> {
  const answer =
    (extra: Record<string, unknown> = {}, id: string = PT.open): Handler =>
    (_req, res) =>
      json(res, video(origin(), id, extra))
  const v = (id: string) => `/api/v1/videos/${id}`
  return {
    "/api/v1/config": (_req, res) => json(res, { instance: { name: "fixture" } }),
    [v(PT.open)]: answer(),
    [v(PT.episode)]: answer({}, PT.episode),
    [v(PT.unlicensed)]: answer({ licence: { id: null } }, PT.unlicensed),
    [v(PT.private)]: answer({ privacy: { id: 2 } }),
    [v(PT.stray)]: answer({
      streamingPlaylists: [{ playlistUrl: "https://evil.example.org/master.m3u8" }],
      files: [],
      shortUUID: undefined,
      uuid: undefined,
    }),
    [v(PT.failing)]: (_req, res) => json(res, { error: "boom" }, 500),
    [v(PT.slow)]: () => undefined, // never answers; the provider's timeout ends it
    [`${v(PT.open)}/captions`]: (_req, res) =>
      json(res, {
        data: [{ language: { id: "en", label: "English" }, captionPath: "/captions/en.vtt" }],
      }),
    "/captions/en.vtt": (_req, res) => {
      res.writeHead(200, { "Content-Type": "text/vtt" })
      res.end(WEBVTT)
    },
  }
}
