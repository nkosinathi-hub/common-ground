export const IDEA_TABS = ["overview", "research", "tasks", "milestones", "discussion"] as const
export type IdeaTab = (typeof IDEA_TABS)[number]

export type Route =
  | { name: "entry" | "not-found" | "sign-in" | "sign-up" | "reset" | "new-password" }
  | { name: "new-space" | "account" | "privacy" }
  | { name: "invite"; token: string }
  | { name: "home" | "watch" | "ideas" | "calendar" | "settings"; spaceId: string }
  | { name: "watch-item"; spaceId: string; itemId: string }
  | { name: "idea"; spaceId: string; ideaId: string; tab: IdeaTab }
  | { name: "event"; spaceId: string; eventId: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const TOKEN = /^[A-Za-z0-9_-]{8,128}$/
const STATIC: Record<string, Route> = {
  "": { name: "entry" },
  "auth/sign-in": { name: "sign-in" },
  "auth/sign-up": { name: "sign-up" },
  "auth/reset": { name: "reset" },
  "auth/new-password": { name: "new-password" },
  "spaces/new": { name: "new-space" },
  account: { name: "account" },
  privacy: { name: "privacy" },
}
const SPACE_PAGES = new Set(["home", "watch", "ideas", "calendar", "settings"])
const notFound: Route = { name: "not-found" }

const isTab = (value: string): value is IdeaTab => (IDEA_TABS as readonly string[]).includes(value)

function parseSpace(spaceId: string, rest: string[]): Route {
  const [page, subject, tab] = rest
  if (!page || !SPACE_PAGES.has(page)) return notFound
  if (subject === undefined) return { name: page as "home", spaceId }
  if (!UUID.test(subject)) return notFound
  if (page === "watch" && tab === undefined) return { name: "watch-item", spaceId, itemId: subject }
  if (page === "calendar" && tab === undefined) return { name: "event", spaceId, eventId: subject }
  if (page !== "ideas" || rest.length > 3) return notFound
  const chosen = tab ?? "overview"
  return isTab(chosen) ? { name: "idea", spaceId, ideaId: subject, tab: chosen } : notFound
}

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, "").split("?")[0]!.replace(/\/$/, "")
  const fixed = STATIC[path]
  if (fixed) return fixed
  const parts = path.split("/")
  if (parts[0] === "invite" && parts.length === 2) {
    return TOKEN.test(parts[1]!) ? { name: "invite", token: parts[1]! } : notFound
  }
  if (parts[0] === "s" && parts[1] && UUID.test(parts[1]))
    return parseSpace(parts[1], parts.slice(2))
  return notFound
}

export function buildHash(route: Route): string {
  switch (route.name) {
    case "entry":
    case "not-found":
      return "#/"
    case "invite":
      return `#/invite/${route.token}`
    case "home":
    case "watch":
    case "ideas":
    case "calendar":
    case "settings":
      return `#/s/${route.spaceId}/${route.name}`
    case "watch-item":
      return `#/s/${route.spaceId}/watch/${route.itemId}`
    case "idea":
      return `#/s/${route.spaceId}/ideas/${route.ideaId}/${route.tab}`
    case "event":
      return `#/s/${route.spaceId}/calendar/${route.eventId}`
    default: {
      const entry = Object.entries(STATIC).find(([, r]) => r.name === route.name)
      return `#/${entry?.[0] ?? ""}`
    }
  }
}
