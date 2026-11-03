import type { Route } from "@/shared/domain"

export const SEARCH_KINDS = {
  page: "Navigation",
  watch: "Title",
  idea: "Idea",
  note: "Note",
  event: "Event",
  task: "Task",
  milestone: "Milestone",
  research: "Research",
  discussion: "Discussion",
  attachment: "Attachment",
} as const
export type SearchKind = keyof typeof SEARCH_KINDS
export interface SearchHit {
  readonly id: string
  readonly kind: SearchKind
  readonly title: string
  readonly preview: string
  readonly route: Route
  readonly catalog?: { type: "movie" | "tv"; id: number }
}
export function navigationHits(spaceId: string, query: string): SearchHit[] {
  const routes: [string, Route][] = [
    ["Home", { name: "home", spaceId }],
    ["Watch", { name: "watch", spaceId }],
    ["Ideas", { name: "ideas", spaceId }],
    ["Notes", { name: "notes", spaceId }],
    ["Calendar", { name: "calendar", spaceId }],
    ["Space settings", { name: "settings", spaceId }],
    ["Account and data", { name: "account" }],
  ]
  return routes
    .filter(([title]) => title.toLowerCase().includes(query.toLowerCase()))
    .map(([title, route]) => ({ id: route.name, kind: "page", title, preview: "", route }))
}
export interface SearchPage {
  readonly hits: readonly SearchHit[]
  readonly unavailable: readonly string[]
  readonly more: boolean
}
export const SEARCH_LIMIT = 12
export const SEARCH_MAX = 160
export const validSearch = (query: string) => query.trim().length >= 2 && query.length <= SEARCH_MAX

export function ranked(hits: readonly SearchHit[], query: string): SearchHit[] {
  const wanted = query.toLowerCase().trim()
  const score = (hit: SearchHit) => {
    const title = hit.title.toLowerCase()
    return title === wanted ? 0 : title.startsWith(wanted) ? 1 : 2
  }
  return [...hits].sort((a, b) => score(a) - score(b) || a.title.localeCompare(b.title))
}
