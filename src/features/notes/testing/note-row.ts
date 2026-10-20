/** A space_notes row as PostgREST returns it, for adapter tests. */
export const AT = "2026-10-16T09:00:00Z"

export const NOTE_ROW = {
  id: "n1",
  space_id: "s1",
  author_id: "ana",
  recipient_id: "ben",
  body: "Hi",
  pinned: true,
  expires_at: null,
  created_at: AT,
  updated_at: AT,
  kind: "note",
  sections: null,
  response_wish: null,
  support_wish: null,
}
