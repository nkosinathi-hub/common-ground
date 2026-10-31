import {
  ACCOUNT_TABS,
  IDEA_TABS,
  PRIVACY_PARTS,
  SETTINGS_TABS,
  TITLE_TABS,
  type Route,
} from "./route-types"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const TOKEN = /^[A-Za-z0-9_-]{8,128}$/
const STATIC: Record<string, Route> = {
  "": { name: "entry" },
  "auth/sign-in": { name: "sign-in" },
  "auth/sign-up": { name: "sign-up" },
  "auth/reset": { name: "reset" },
  "auth/new-password": { name: "new-password" },
  demo: { name: "demo" },
  "spaces/new": { name: "new-space" },
  account: { name: "account" },
  privacy: { name: "privacy" },
}
const SPACE_PAGES = new Set(["home", "watch", "ideas", "calendar"])
const notFound: Route = { name: "not-found" }

/** The value when it is one of the allowed ones; undefined when absent; null when unknown. */
function oneOf<T extends string>(allowed: readonly T[], value: string | undefined) {
  if (value === undefined) return undefined
  return (allowed as readonly string[]).includes(value) ? (value as T) : null
}

function parseSubject(spaceId: string, page: string, subject: string, tab?: string): Route {
  if (page === "home") {
    if (subject !== "notes") return notFound
    if (tab === undefined) return { name: "notes", spaceId }
    return UUID.test(tab) ? { name: "note", spaceId, noteId: tab } : notFound
  }
  if (!UUID.test(subject)) return notFound
  if (page === "watch") {
    const chosen = oneOf(TITLE_TABS, tab)
    if (chosen === null) return notFound
    return { name: "watch-item", spaceId, itemId: subject, ...(chosen && { tab: chosen }) }
  }
  if (page === "calendar")
    return tab === undefined ? { name: "event", spaceId, eventId: subject } : notFound
  const chosen = oneOf(IDEA_TABS, tab ?? "overview")
  return chosen ? { name: "idea", spaceId, ideaId: subject, tab: chosen } : notFound
}

function parseSpace(spaceId: string, rest: string[]): Route {
  const [page, subject, tab, ...extra] = rest
  if (extra.length > 0 || !page) return notFound
  if (page === "party")
    return rest.length === 2 && UUID.test(subject!)
      ? { name: "party", spaceId, partyId: subject! }
      : notFound
  if (page === "settings") {
    const chosen = oneOf(SETTINGS_TABS, subject)
    return chosen === null || tab
      ? notFound
      : { name: "settings", spaceId, ...(chosen && { tab: chosen }) }
  }
  if (!SPACE_PAGES.has(page)) return notFound
  if (subject === undefined) return { name: page as "home", spaceId }
  return parseSubject(spaceId, page, subject, tab)
}

function parseAccount(parts: string[]): Route {
  if (parts[1] === "privacy" && parts.length === 3) {
    const part = oneOf(PRIVACY_PARTS, parts[2])
    return part ? { name: "privacy", part } : notFound
  }
  const tab = parts.length === 2 ? oneOf(ACCOUNT_TABS, parts[1]) : null
  return tab ? { name: "account", tab } : notFound
}

const pathOf = (hash: string) => hash.replace(/^#\/?/, "").split("?")[0]!.replace(/\/$/, "")

export function parseHash(hash: string): Route {
  const path = pathOf(hash)
  const fixed = STATIC[path]
  if (fixed) return fixed
  const parts = path.split("/")
  if (parts[0] === "invite" && parts.length === 2)
    return TOKEN.test(parts[1]!) ? { name: "invite", token: parts[1]! } : notFound
  if (parts[0] === "account") return parseAccount(parts)
  if (parts[0] === "s" && parts[1] && UUID.test(parts[1]))
    return parseSpace(parts[1], parts.slice(2))
  return notFound
}

/** The query after the path, e.g. `?view=board&day=2026-10-27`, for views that live in the link. */
export const queryOf = (hash: string): URLSearchParams =>
  new URLSearchParams(hash.split("?").slice(1).join("?"))
