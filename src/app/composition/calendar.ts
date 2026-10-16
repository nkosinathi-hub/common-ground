import {
  CalendarService,
  provideCalendar,
  type LinkOption,
  type LinkSearch,
} from "@/features/calendar"
import { SupabaseCalendar } from "@/features/calendar/infrastructure/supabase-calendar"
import type { IdeasService } from "@/features/ideas"
import type { WatchService } from "@/features/watch"
import { map, type AuthorDirectory, type MemberDirectory } from "@/shared/domain"
import { settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"

const LIMIT = 20
const ANY_TITLE = { mediaType: null, intent: null, myStatus: null, sort: "title" } as const

const options =
  (kind: LinkOption["kind"]) =>
  (rows: readonly { id: string; title: string }[]): LinkOption[] =>
    rows.slice(0, LIMIT).map((row) => ({ kind, id: row.id, label: row.title }))

// ilike treats % and _ as wildcards; a search for "100%" means the text itself.
const literal = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`)

/** Tasks have no space-wide search in their feature yet, so this one reads the table directly. */
function searchTasks(db: Db, spaceId: string, query: string) {
  const found = db
    .from("tasks")
    .select("id, title")
    .eq("space_id", spaceId)
    .ilike("title", `%${literal(query)}%`)
    .order("title")
    .limit(LIMIT)
  return settle(found, options("task"))
}

/** The calendar's LinkSearch port over the watch and ideas services (and the tasks table). */
export function linkSearch(db: Db, watch: WatchService, ideas: IdeasService): LinkSearch {
  return {
    async search(spaceId, kind, query) {
      if (kind === "watch_item") {
        const page = await watch.list(spaceId, { ...ANY_TITLE, search: query })
        return map(page, (value) => options("watch_item")(value.items))
      }
      if (kind === "task") return searchTasks(db, spaceId, query)
      const page = await ideas.list(spaceId, null)
      const wanted = query.toLowerCase()
      return map(page, (value) =>
        options("idea")(value.items.filter((idea) => idea.title.toLowerCase().includes(wanted))),
      )
    },
    async watchNight(spaceId) {
      return map(await watch.togetherQueue(spaceId), options("watch_item"))
    },
  }
}

export function composeCalendar(
  db: Db,
  watch: WatchService,
  ideas: IdeasService,
  members: MemberDirectory,
  authors?: AuthorDirectory,
) {
  const links = linkSearch(db, watch, ideas)
  return new CalendarService(new SupabaseCalendar(db), links, members, authors)
}

export const provideCalendarFeature = (service: CalendarService) => provideCalendar({ service })
