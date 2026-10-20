import type { IncomingMessage, ServerResponse } from "node:http"
import { json, type Handler } from "./fixture-server"

export const TOKEN = "jf-token-123"
export const TICKS = 10_000_000

const subtitles = (id: string) => [
  {
    ...{ Type: "Subtitle", Index: 2, DeliveryMethod: "External", IsTextSubtitleStream: true },
    ...{ Language: "eng", DisplayTitle: "English" },
    DeliveryUrl: `/Videos/${id}/ms/Subtitles/2/0/Stream.vtt?api_key=${TOKEN}`,
  },
  {
    ...{ Type: "Subtitle", Index: 3, DeliveryMethod: "Encode", IsTextSubtitleStream: false },
    ...{ Language: "fre", DisplayTitle: "PGS" },
  },
]

/** PlaybackInfo as Jellyfin 12 answers it: m1 direct-plays, the rest only transcode to HLS. */
export function playbackInfo(req: IncomingMessage, res: ServerResponse) {
  const id = /\/Items\/([^/]+)\/PlaybackInfo/.exec(req.url ?? "")?.[1] ?? ""
  const direct = id === "m1"
  const hls = `/videos/${id}/master.m3u8?MediaSourceId=ms&api_key=${TOKEN}&PlaySessionId=ps1`
  json(res, {
    PlaySessionId: "ps1",
    MediaSources: [
      {
        ...{ Id: `ms-${id}`, Container: "mp4" },
        ...{ SupportsDirectPlay: direct, SupportsDirectStream: direct },
        ...(direct ? {} : { TranscodingUrl: hls }),
        MediaStreams: [{ Type: "Video", Index: 0, Height: 1080 }, ...subtitles(id)],
      },
    ],
  })
}

/** MediaSegments: m1 has an intro and credits (Commercial is ignored by the adapter). */
export const segments: Handler = (req, res) =>
  json(res, {
    Items: req.url?.includes("/m1")
      ? [
          { Type: "Intro", StartTicks: 5 * TICKS, EndTicks: 65 * TICKS },
          { Type: "Outro", StartTicks: 5000 * TICKS, EndTicks: 5100 * TICKS },
          { Type: "Commercial", StartTicks: 10 * TICKS, EndTicks: 20 * TICKS },
        ]
      : [],
  })
