import { bareOrigin } from "../src/shared/domain/origin"

const NETFLIX = "https://www.netflix.com/*"

export type Target = "chromium" | "firefox"

/** Firefox 140 (ESR) is the first with data collection declarations; the id keeps signing stable. */
const GECKO = {
  id: "watch-party@common-ground.nkosinathi-hub.github.io",
  strict_min_version: "140.0",
  // It sends the sign-in and the party's playback state to the household's own Supabase.
  data_collection_permissions: { required: ["authenticationInfo", "websiteActivity"] },
}

interface ContentScript {
  readonly matches: string[]
  readonly js: string[]
  readonly run_at: "document_idle"
  readonly world?: "MAIN"
}

/**
 * The Manifest V3 manifest: Chrome and Edge 111+, or Firefox 140+ (both have MAIN-world content
 * scripts; Firefox also needs an add-on id). Permissions
 * are the minimum: storage for the session and the joined party, and hosts netflix.com and the
 * build's Supabase origin. The content script matches all of netflix.com because Netflix moves
 * to a watch page without reloading; it plays a party only on /watch/<id> (src/content.ts).
 */
export function manifestFor(supabaseUrl: string, version: string, target: Target = "chromium") {
  const supabase = `${bareOrigin(supabaseUrl).origin}/*`
  const script = (js: string, main = false): ContentScript => ({
    matches: [NETFLIX],
    js: [js],
    run_at: "document_idle",
    ...(main ? { world: "MAIN" as const } : {}),
  })
  return {
    manifest_version: 3,
    name: "Common Ground watch party",
    description: "Watch Netflix together in sync: each of you on your own account.",
    version,
    ...(target === "firefox"
      ? {
          browser_specific_settings: {
            gecko: GECKO,
            gecko_android: { strict_min_version: "142.0" },
          },
        }
      : { minimum_chrome_version: "111" }),
    permissions: ["storage"],
    host_permissions: [NETFLIX, supabase],
    icons: { "192": "icon.png" },
    action: { default_title: "Common Ground", default_popup: "popup.html" },
    content_scripts: [script("content.js"), script("page.js", true)],
    content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'" },
  }
}
