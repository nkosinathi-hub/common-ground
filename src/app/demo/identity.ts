export const demoId = (n: number) => `00000000-0000-4000-a000-${String(n).padStart(12, "0")}`
export const SPACE = demoId(1)
export const ANA = demoId(2)
export const BEN = demoId(3)
/** A second sample space with five people, to show how lists look with more than two. */
export const CLUB = demoId(4)
export const CLUB_PEOPLE = [
  [demoId(5), "Cy"],
  [demoId(6), "Dee"],
  [demoId(7), "Eve"],
  [demoId(8), "Fin"],
] as const
export const now = new Date().toISOString()
export const today = now.slice(0, 10)
export const demoUser = {
  id: ANA,
  email: "ana@example.invalid",
  aud: "authenticated",
  role: "authenticated",
  email_confirmed_at: now,
  created_at: now,
  app_metadata: {},
  user_metadata: { display_name: "Ana" },
}
export const demoSpace = {
  id: SPACE,
  name: "Ana & Ben",
  template: "couple",
  tagline: "Our shared corner",
  description: "A sample space for watching, planning and sharing together.",
  look: {},
  icon: "heart",
  avatar_path: null,
  cover_path: null,
  background_path: null,
  home_cards: [
    "notes",
    "continue_watching",
    "ideas",
    "calendar",
    "coming_up",
    "recommended",
    "activity",
  ],
  default_watch_intent: "watch_together",
  week_starts_on: 1,
}
export const clubSpace = {
  ...demoSpace,
  id: CLUB,
  name: "Book club",
  template: "friends",
  tagline: "Five friends, one watchlist",
  icon: "book-open",
}
const member = (space: typeof demoSpace, user_id: string, name: string, role = "member") => ({
  user_id,
  role,
  profiles: { display_name: name },
  space_id: space.id,
  joined_at: now,
  spaces: space,
})
export const members = [
  member(demoSpace, ANA, "Ana", "owner"),
  member(demoSpace, BEN, "Ben"),
  member(clubSpace, ANA, "Ana"),
  ...CLUB_PEOPLE.map(([id, name], i) => member(clubSpace, id, name, i === 0 ? "owner" : "member")),
]
