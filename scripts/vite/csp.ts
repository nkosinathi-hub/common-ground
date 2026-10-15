/**
 * GitHub Pages cannot send headers, so the Content Security Policy ships as a meta tag built
 * from the configured Supabase origin. frame-ancestors is header-only and not set here.
 */
export function contentSecurityPolicy(supabaseUrl: string): string {
  let origin: URL
  try {
    origin = new URL(supabaseUrl)
  } catch {
    throw new Error("Content Security Policy needs a valid VITE_SUPABASE_URL")
  }
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
  return {
    name: "common-ground-csp",
    transformIndexHtml(html: string): string {
      const tag = `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(supabaseUrl)}" />`
      return html.replace("<head>", `<head>${tag}`)
    },
  }
}
