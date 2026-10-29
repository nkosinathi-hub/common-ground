/** A full spaces row as PostgREST returns it, for adapter tests. */
export const SPACE_ROW = {
  id: "s1",
  name: "Us",
  template: "couple" as const,
  tagline: "Hi",
  description: "",
  look: { button: "#1e6b66", corners: "pill" },
  icon: "heart",
  avatar_path: "s1/avatar/a.webp",
  cover_path: null,
  background_path: null,
  home_cards: ["ideas", "gone", "notes"],
  default_watch_intent: "watch_together" as const,
  week_starts_on: 0,
}
