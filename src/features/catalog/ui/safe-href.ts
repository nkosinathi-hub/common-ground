const WEB = new Set(["http:", "https:"])

/**
 * The link to render as an href, or null when it is not an absolute http(s) URL. The catalog
 * function already filters links; this re-checks at render time so a bad value never becomes a
 * clickable javascript:, data: or relative link.
 */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return WEB.has(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}
