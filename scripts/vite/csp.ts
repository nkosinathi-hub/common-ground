/**
 * GitHub Pages cannot send headers, so the Content Security Policy ships as a meta tag built
 * from the configured Supabase origin. frame-ancestors is header-only, so src/app/framing.ts
 * refuses to render inside a frame instead (docs/security.md).
 */
import { bareOrigin } from "../../src/shared/domain/origin"

/** Origins the compiled-in playback plugins declared (docs/playback-plugins.md). */
export interface PlaybackOrigins {
  readonly connect: readonly string[]
  readonly media: readonly string[]
  readonly frames: readonly string[]
}

const NO_PLAYBACK: PlaybackOrigins = { connect: [], media: [], frames: [] }
const list = (origins: readonly string[]) => origins.map((o) => ` ${o}`).join("")

/**
 * `siteUrl` is set for the Android app, which checks the website for a newer APK. Playback
 * origins widen only connect-src, media-src and frame-src; script-src stays 'self'. Media
 * Source Extensions play from blob: URLs, so media-src always allows blob:.
 */
export function contentSecurityPolicy(
  supabaseUrl: string,
  siteUrl = "",
  playback: PlaybackOrigins = NO_PLAYBACK,
): string {
  const origin = bareOrigin(supabaseUrl)
  const release = siteUrl ? ` ${new URL("app/version.json", siteUrl).href}` : ""
  const http = origin.origin
  const socket = `${origin.protocol === "https:" ? "wss:" : "ws:"}//${origin.host}`
  const frames = playback.frames.length ? playback.frames.join(" ") : "'none'"
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://image.tmdb.org ${http}`,
    `connect-src 'self' ${http} ${socket}${release}${list(playback.connect)}`,
    `media-src 'self' blob:${list(playback.media)}`,
    `frame-src ${frames}`,
    "font-src 'self'",
    // Realtime runs its heartbeat in a worker made from a blob (the party channel's keepalive).
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join("; ")
}

export function cspPlugin(supabaseUrl: string, siteUrl = "", playback = NO_PLAYBACK) {
  const policy = contentSecurityPolicy(supabaseUrl, siteUrl, playback)
  return {
    name: "common-ground-csp",
    transformIndexHtml(html: string): string {
      const csp = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`
      const referrer = '<meta name="referrer" content="strict-origin" />'
      return html.replace("<head>", `<head>${csp}${referrer}`)
    },
  }
}
