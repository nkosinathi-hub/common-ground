import { ANA, BEN, CLUB_PEOPLE, clubSpace, demoSpace, members, now } from "./identity"
import { watchRows, progressRows } from "./watch-data"
import { ideaTables } from "./idea-data"
import { events } from "./calendar-data"
import { socialTables } from "./social-data"

export type DemoRow = Record<string, unknown>

export const tables: Record<string, DemoRow[]> = {
  spaces: [demoSpace, clubSpace],
  space_members: members,
  profiles: [
    { id: ANA, display_name: "Ana" },
    { id: BEN, display_name: "Ben" },
    ...CLUB_PEOPLE.map(([id, display_name]) => ({ id, display_name })),
  ],
  watch_items: watchRows,
  watch_progress: progressRows,
  together_progress: watchRows.flatMap((row) =>
    row.together ? [{ watch_item_id: row.id, ...row.together }] : [],
  ),
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
