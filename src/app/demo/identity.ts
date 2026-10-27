export const demoId = (n: number) => `00000000-0000-4000-a000-${String(n).padStart(12, "0")}`
export const SPACE = demoId(1)
export const ANA = demoId(2)
export const BEN = demoId(3)
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
  theme: null,
  accent_color: null,
  icon: "heart",
  avatar_path: null,
  cover_path: null,
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
export const members = [
  { user_id: ANA, role: "owner", profiles: { display_name: "Ana" } },
  { user_id: BEN, role: "member", profiles: { display_name: "Ben" } },
].map((member) => ({ ...member, space_id: SPACE, joined_at: now, spaces: demoSpace }))
