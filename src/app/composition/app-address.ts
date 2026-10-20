import type { AppAddress } from "@/features/auth"

export interface PublicAddress extends AppAddress {
  /** Absolute app root, used for invite links. */
  readonly url: string
}

const PLAIN_HTTPS =
  "VITE_PUBLIC_APP_URL must be a plain https URL, e.g. https://host/common-ground/"

/**
 * Where email and invite links point. The website uses the page's own address; the Android
 * app (served from https://localhost) sets VITE_PUBLIC_APP_URL to the website, whose App
 * Links then open the app.
 */
export function appAddress(
  publicUrl: string | undefined,
  origin: string,
  basePath: string,
): PublicAddress {
  if (!publicUrl) return { origin, basePath, url: `${origin}${basePath}` }
  const url = new URL(publicUrl)
  if (url.protocol !== "https:" || url.search || url.hash) throw new Error(PLAIN_HTTPS)
  const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`
  return { origin: url.origin, basePath: path, url: `${url.origin}${path}` }
}
