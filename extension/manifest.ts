import { bareOrigin } from "../src/shared/domain/origin"

const NETFLIX = "https://www.netflix.com/*"

interface ContentScript {
  readonly matches: string[]
  readonly js: string[]
  readonly run_at: "document_idle"
  readonly world?: "MAIN"
}

/**
 * The Manifest V3 manifest (Chrome and Edge 111+, for MAIN-world content scripts). Permissions
 * are the minimum: storage for the session and the joined party, and hosts netflix.com and the
 * build's Supabase origin. The content script matches all of netflix.com because Netflix moves
 * to a watch page without reloading; it plays a party only on /watch/<id> (src/content.ts).
 */
export function manifestFor(supabaseUrl: string, version: string) {
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
    minimum_chrome_version: "111",
    permissions: ["storage"],
    host_permissions: [NETFLIX, supabase],
    icons: { "192": "icon.png" },
    action: { default_title: "Common Ground", default_popup: "popup.html" },
    content_scripts: [script("content.js"), script("page.js", true)],
    content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'" },
  }
}
