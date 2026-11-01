import { appError, err, ok, type Result } from "../../../shared/domain/result"

export const SUBTITLE_MAX_BYTES = 2 * 1024 * 1024
const TIMING = /^(\d{2,}:)?\d{2}:\d{2}[.,]\d{3}\s+-->\s+(\d{2,}:)?\d{2}:\d{2}[.,]\d{3}/m

/** Convert SubRip once; applying this again to WebVTT leaves it unchanged. */
export function subtitleVtt(name: string, input: string): Result<string> {
  const text = input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim()
  const invalid = () =>
    err(appError("validation", "Choose a valid .srt or .vtt subtitle file (up to 2 MB)"))
  if (!/\.(srt|vtt)$/i.test(name) || text.includes("\0") || !TIMING.test(text)) return invalid()
  if (/^WEBVTT(?:\s|$)/.test(text)) return ok(`${text}\n`)
  if (!/\.srt$/i.test(name)) return invalid()
  const cues = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
  return ok(`WEBVTT\n\n${cues}\n`)
}
