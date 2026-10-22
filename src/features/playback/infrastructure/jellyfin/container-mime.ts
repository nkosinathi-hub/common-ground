const MP4 = new Set(["mp4", "m4v", "mov", "m4a", "3gp", "3g2", "mj2"])

/**
 * A direct-play file's MIME type from Jellyfin's Container, which is ffmpeg's demuxer name:
 * an .mp4 says "mov,mp4,m4a,3gp,3g2,mj2", Matroska and WebM say "matroska,webm". Browsers and
 * shaka-player know video/mp4 and video/webm; video/mov would make them refuse the file.
 */
export function containerMime(container: string | undefined): string {
  const names = (container ?? "mp4")
    .toLowerCase()
    .split(",")
    .map((n) => n.trim())
  if (names.some((n) => MP4.has(n))) return "video/mp4"
  if (names.includes("webm")) return "video/webm"
  if (names.some((n) => n === "mkv" || n === "matroska")) return "video/x-matroska"
  return "video/mp4"
}
