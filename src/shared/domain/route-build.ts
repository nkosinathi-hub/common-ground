import type { Route } from "./route-types"

const STATIC: Partial<Record<Route["name"], string>> = {
  entry: "#/",
  "not-found": "#/",
  "sign-in": "#/auth/sign-in",
  "sign-up": "#/auth/sign-up",
  reset: "#/auth/reset",
  "new-password": "#/auth/new-password",
  demo: "#/demo",
  "new-space": "#/spaces/new",
}

const tail = (tab: string | undefined) => (tab ? `/${tab}` : "")

function spaceHash(route: Route & { spaceId: string }): string {
  const base = `#/s/${route.spaceId}`
  switch (route.name) {
    case "settings":
      return `${base}/settings${tail(route.tab)}`
    case "notes":
      return `${base}/home/notes`
    case "note":
      return `${base}/home/notes/${route.noteId}`
    case "watch-item":
      return `${base}/watch/${route.itemId}${tail(route.tab)}`
    case "idea":
      return `${base}/ideas/${route.ideaId}/${route.tab}`
    case "event":
      return `${base}/calendar/${route.eventId}`
    case "party":
      return `${base}/party/${route.partyId}`
    default:
      return `${base}/${route.name}`
  }
}

export function buildHash(route: Route): string {
  if ("spaceId" in route) return spaceHash(route)
  if (route.name === "invite") return `#/invite/${route.token}`
  if (route.name === "account") return `#/account${tail(route.tab)}`
  if (route.name === "privacy") return route.part ? `#/account/privacy/${route.part}` : "#/privacy"
  return STATIC[route.name] ?? "#/"
}

/** A hash with view state in its query; empty values are left out, so defaults keep clean links. */
export function withQuery(hash: string, query: Record<string, string | null | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value)
  const text = params.toString()
  return text ? `${hash.split("?")[0]}?${text}` : hash.split("?")[0]!
}
