/** Answers whether this browser or WebView decodes a MIME type with codecs. */
export type CodecProbe = (type: string) => boolean

const VIDEO: [string, string][] = [
  ["h264", 'video/mp4; codecs="avc1.640028"'],
  ["hevc", 'video/mp4; codecs="hvc1.1.6.L120.90"'],
  ["av1", 'video/mp4; codecs="av01.0.08M.08"'],
  ["vp9", 'video/webm; codecs="vp9"'],
]
const AUDIO: [string, string][] = [
  ["aac", 'audio/mp4; codecs="mp4a.40.2"'],
  ["mp3", "audio/mpeg"],
  ["opus", 'audio/webm; codecs="opus"'],
  ["flac", 'audio/mp4; codecs="flac"'],
  ["ac3", 'audio/mp4; codecs="ac-3"'],
  ["eac3", 'audio/mp4; codecs="ec-3"'],
]

const supported = (probe: CodecProbe, list: [string, string][]) =>
  list.filter(([, type]) => probe(type)).map(([codec]) => codec)

/** Text formats Jellyfin converts to WebVTT; image formats are burned in (Encode). */
const TEXT = ["vtt", "subrip", "srt", "ass", "ssa", "webvtt"]
const IMAGE = ["pgssub", "pgs", "dvdsub", "dvbsub", "vobsub"]

/**
 * An honest DeviceProfile: only codecs this device reported it can decode. Jellyfin direct-plays
 * what fits and transcodes the rest to fMP4 HLS with H.264 and AAC, which every MSE device plays.
 */
export function deviceProfile(probe: CodecProbe, maxBitrate: number) {
  const video = supported(probe, VIDEO)
  const audio = supported(probe, AUDIO)
  return {
    Name: "Common Ground",
    MaxStreamingBitrate: maxBitrate,
    DirectPlayProfiles: [
      {
        Container: "mp4,m4v,mov",
        Type: "Video",
        VideoCodec: video.join(","),
        AudioCodec: audio.join(","),
      },
      ...(video.includes("vp9")
        ? [{ Container: "webm", Type: "Video", VideoCodec: "vp9,av1", AudioCodec: "opus" }]
        : []),
    ],
    TranscodingProfiles: [
      {
        ...{ Container: "mp4", Type: "Video", Protocol: "hls", Context: "Streaming" },
        ...{ VideoCodec: "h264", AudioCodec: "aac", MinSegments: 1, BreakOnNonKeyFrames: true },
      },
    ],
    SubtitleProfiles: [
      ...TEXT.map((Format) => ({ Format, Method: "External" })),
      ...IMAGE.map((Format) => ({ Format, Method: "Encode" })),
    ],
    CodecProfiles: [],
    ContainerProfiles: [],
  }
}
