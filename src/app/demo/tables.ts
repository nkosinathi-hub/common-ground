import { ANA, BEN, demoSpace, members, now } from "./identity"
import { watchRows, progressRows } from "./watch-data"
import { ideaTables } from "./idea-data"
import { events } from "./calendar-data"
import { socialTables } from "./social-data"

export type DemoRow = Record<string, unknown>

export const tables: Record<string, DemoRow[]> = {
  spaces: [demoSpace],
  space_members: members,
  profiles: [
    { id: ANA, display_name: "Ana" },
    { id: BEN, display_name: "Ben" },
  ],
  watch_items: watchRows,
  watch_progress: progressRows,
  together_progress: [{ watch_item_id: watchRows[0]!.id, season: 1, episode: 2 }],
  watch_sessions: [
    {
      id: "sample-session",
      watch_item_id: watchRows[0]!.id,
      watched_on: now.slice(0, 10),
      note: "Friday evening",
      watch_session_members: [{ user_id: ANA }, { user_id: BEN }],
    },
  ],
  calendar_events: events,
  ...ideaTables,
  ...socialTables,
  space_invites: [],
  space_note_drafts: [],
  recommendations: [],
  attachments: [],
  watch_parties: [],
  simkl_links: [],
}
