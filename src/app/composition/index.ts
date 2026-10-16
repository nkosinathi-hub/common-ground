import { createSupabase, type Db } from "@/shared/infrastructure/supabase"
import { composeCalendar, provideCalendarFeature } from "./calendar"
import { composeCollaboration, provideCollaboration } from "./collaboration"
import { composeCore, provideCore } from "./core"
import { composeIdeas, provideIdeasFeatures } from "./ideas"
import { authorDirectory, memberDirectory, provideMembers } from "./members"
import { composeNotes, provideNotesFeature } from "./notes"
import { composeWatch, provideWatchFeature } from "./watch"

/** The only place adapters are constructed. Features receive services through context. */
export function compose(db: Db = createSupabase()) {
  const core = composeCore(db)
  const members = memberDirectory(core.spaces)
  const watch = composeWatch(db)
  const ideas = composeIdeas(db, members)
  return {
    ...core,
    members,
    authors: authorDirectory(core.spaces),
    watch,
    ideas,
    collaboration: composeCollaboration(db),
    calendar: composeCalendar(db, watch, ideas.ideas, members),
    notes: composeNotes(db, members),
  }
}

export type Services = ReturnType<typeof compose>

export function provideServices(services: Services): void {
  provideCore(services)
  provideMembers({ members: services.members, authors: services.authors })
  provideCollaboration(services.collaboration)
  provideWatchFeature(services.watch, services.members, services.authors)
  provideIdeasFeatures(services.ideas)
  provideCalendarFeature(services.calendar)
  provideNotesFeature(services.notes, services.session)
}
