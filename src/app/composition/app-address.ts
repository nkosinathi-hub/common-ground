import type { AppAddress } from "@/features/auth"

export interface PublicAddress extends AppAddress {
  /** Absolute app-link page, the base of invite links. */
  readonly url: string
}

/** The one path the Android app claims as an App Link (public/app-link/, AndroidManifest.xml). */
export const APP_LINK = "app-link/"

const PLAIN_HTTPS =
  "VITE_PUBLIC_APP_URL must be a plain https URL, e.g. https://host/common-ground/"

/**
 * Where email and invite links point. The website's email links come back to the website: the
 * PKCE verifier is in that browser. The Android app (served from https://localhost) sets
 * VITE_PUBLIC_APP_URL; its email links go to the app-link page, which only the app opens.
 * Invites carry no verifier, so they always use the app-link page: the app when installed,
 * otherwise the page forwards to the website.
 */
export function appAddress(
  publicUrl: string | undefined,
  origin: string,
  basePath: string,
): PublicAddress {
  if (!publicUrl) return { origin, basePath, url: `${origin}${basePath}${APP_LINK}` }
  const url = new URL(publicUrl)
  if (url.protocol !== "https:" || url.search || url.hash) throw new Error(PLAIN_HTTPS)
  const site = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`
  const link = `${site}${APP_LINK}`
  return { origin: url.origin, basePath: link, url: `${url.origin}${link}` }
}
