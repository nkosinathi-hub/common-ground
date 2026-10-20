import { parseHash } from "@/shared/domain"

/**
 * An App Link to the website, as the path to load inside the app. Query and hash survive, so
 * boot finishes an emailed `?code=` and the router opens `#/invite/<token>`.
 */
export function inAppPath(link: string, siteUrl: string): string | null {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return null
  }
  const site = new URL(siteUrl)
  const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`
  if (url.origin !== site.origin || path !== site.pathname) return null
  return `/${url.search}${url.hash}`
}

const ROOTS = new Set(["entry", "home", "sign-in", "not-found"])

/** Android back: follow the app's history, and leave from a root page instead of blanking. */
export function backAction(hash: string, canGoBack: boolean): "back" | "leave" {
  return canGoBack && !ROOTS.has(parseHash(hash).name) ? "back" : "leave"
}

/** The hash a tapped push opens, only when it is one of the app's own routes. */
export function pushRoute(data: Record<string, unknown>): string | null {
  const route = data.route
  if (typeof route !== "string" || !route.startsWith("#/")) return null
  return parseHash(route).name === "not-found" ? null : route
}
