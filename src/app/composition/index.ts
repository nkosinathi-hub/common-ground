import { Capacitor } from "@capacitor/core"
import { preferencesStorage } from "@/shared/infrastructure/preferences-storage"
import { createSupabase, type Db } from "@/shared/infrastructure/supabase"
import { composeCalendar, provideCalendarFeature } from "./calendar"
import { composeCollaboration, provideCollaboration } from "./collaboration"
import { composeCore, provideCore } from "./core"
import { composeIdeas, provideIdeasFeatures } from "./ideas"
import { authorDirectory, memberDirectory, provideMembers } from "./members"
import { composeNotes, provideNotesFeature } from "./notes"
import { composeParties, providePartiesFeature } from "./parties"
import { composeWatch, provideWatchFeature } from "./watch"

/** The Android app keeps its session in Preferences; the website in browser storage. */
function createDb(): Db {
  const native = Capacitor.isNativePlatform()
  return createSupabase(undefined, undefined, native ? preferencesStorage : undefined)
}

/** The only place adapters are constructed. Features receive services through context. */
export function compose(db: Db = createDb()) {
  const core = composeCore(db)
  const members = memberDirectory(core.spaces)
  const authors = authorDirectory(core.spaces)
  const watch = composeWatch(db)
  const ideas = composeIdeas(db, members, authors)
  return {
    ...core,
    members,
    authors,
    watch,
    ideas,
    collaboration: composeCollaboration(db),
    calendar: composeCalendar(db, watch, ideas.ideas, members, authors),
    notes: composeNotes(db, members, authors),
    parties: composeParties(db),
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
  providePartiesFeature(services.parties, services.members)
}
