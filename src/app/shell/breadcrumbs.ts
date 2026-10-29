import { buildHash, type Route } from "@/shared/domain"

export interface Crumb {
  readonly label: string
  /** Absent on the last crumb, the page itself. */
  readonly href?: string
}

const PAGE_LABELS: Partial<Record<Route["name"], string>> = {
  home: "Home",
  notes: "Notes",
  note: "Note",
  watch: "Watch",
  "watch-item": "Title",
  party: "Watch party",
  ideas: "Ideas",
  idea: "Idea",
  calendar: "Calendar",
  event: "Event",
  settings: "Space settings",
  account: "Account",
  privacy: "Privacy",
}

/** The page a route sits under, if any: a title under Watch, a note under Notes. */
function parentOf(route: Route): Route | null {
  if (!("spaceId" in route)) return route.name === "privacy" ? { name: "account" } : null
  const { spaceId } = route
  if (route.name === "notes") return { name: "home", spaceId }
  if (route.name === "note") return { name: "notes", spaceId }
  if (route.name === "watch-item" || route.name === "party") return { name: "watch", spaceId }
  if (route.name === "idea") return { name: "ideas", spaceId }
  if (route.name === "event") return { name: "calendar", spaceId }
  return null
}

/**
 * The top bar's breadcrumb (Figma 185:779): space, parent pages, then the page. `title` names
 * the page itself when it has one, such as the title or idea open.
 */
export function crumbsOf(route: Route, spaceName: string | null, title?: string): Crumb[] {
  const trail: Crumb[] = []
  for (let parent = parentOf(route); parent; parent = parentOf(parent))
    trail.unshift({ label: PAGE_LABELS[parent.name] ?? "", href: buildHash(parent) })
  const space =
    "spaceId" in route && spaceName
      ? [{ label: spaceName, href: buildHash({ name: "home", spaceId: route.spaceId }) }]
      : []
  return [...space, ...trail, { label: title || (PAGE_LABELS[route.name] ?? "") }]
}
