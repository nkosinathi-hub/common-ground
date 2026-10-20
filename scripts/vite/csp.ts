/**
 * GitHub Pages cannot send headers, so the Content Security Policy ships as a meta tag built
 * from the configured Supabase origin. frame-ancestors is header-only, so src/app/framing.ts
 * refuses to render inside a frame instead (docs/security.md).
 */
import { bareOrigin } from "../../src/shared/domain/origin"

export function contentSecurityPolicy(supabaseUrl: string): string {
  const origin = bareOrigin(supabaseUrl)
  const http = origin.origin
  const socket = `${origin.protocol === "https:" ? "wss:" : "ws:"}//${origin.host}`
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://image.tmdb.org ${http}`,
    `connect-src 'self' ${http} ${socket}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join("; ")
}

export function cspPlugin(supabaseUrl: string) {
  const policy = contentSecurityPolicy(supabaseUrl)
  return {
    name: "common-ground-csp",
    transformIndexHtml(html: string): string {
      const csp = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`
      const referrer = '<meta name="referrer" content="strict-origin" />'
      return html.replace("<head>", `<head>${csp}${referrer}`)
    },
  }
}
