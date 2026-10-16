import { createSupabase, type Db } from "@/shared/infrastructure/supabase"
import { composeCalendar, provideCalendarFeature } from "./calendar"
import { composeCollaboration, provideCollaboration } from "./collaboration"
import { composeCore, provideCore } from "./core"
import { composeIdeas, provideIdeasFeatures } from "./ideas"
import { memberDirectory } from "./members"
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
  provideCollaboration(services.collaboration)
  provideWatchFeature(services.watch, services.members)
  provideIdeasFeatures(services.ideas)
  provideCalendarFeature(services.calendar)
  provideNotesFeature(services.notes, services.session)
}
