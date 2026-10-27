import { ANA, BEN, SPACE, demoId, now } from "./identity"

const noteRows = [
  "I found a lovely campsite near the river. Adding it to our trip idea!",
  "The new episode was so good. Let's save the next one for Friday?",
].map((body, i) => ({
  id: demoId(50 + i),
  space_id: SPACE,
  author_id: BEN,
  recipient_id: null,
  body,
  pinned: i === 0,
  expires_at: null,
  created_at: now,
  kind: "note",
  sections: {},
  response_wish: null,
  support_wish: null,
  space_note_replies: [{ count: 1 }],
  space_note_reads: [],
  latest: [{ created_at: now }],
  responses: [],
}))
export const socialTables = {
  space_notes: noteRows,
  space_note_replies: noteRows.map((note, i) => ({
    id: demoId(52 + i),
    note_id: note.id,
    author_id: ANA,
    body: "Let's make a plan together.",
    created_at: now,
  })),
  comments: [
    { watch_item_id: demoId(10), idea_id: null, body: "Let's watch the next episode on Friday." },
    {
      watch_item_id: null,
      idea_id: demoId(20),
      body: "I can research the campsites this weekend.",
    },
  ].map((comment, i) => ({
    ...comment,
    id: demoId(60 + i),
    space_id: SPACE,
    author_id: BEN,
    spoiler: false,
    edited: false,
    created_at: now,
    comment_mentions: [],
  })),
  activity_events: [
    {
      id: demoId(65),
      space_id: SPACE,
      event_type: "idea_created",
      subject_type: "idea",
      subject_id: demoId(20),
      created_at: now,
      by_me: false,
      actor: { display_name: "Ben" },
      target: null,
    },
  ],
  notifications: [
    {
      id: demoId(66),
      space_id: SPACE,
      type: "comment",
      subject_type: "watch_item",
      subject_id: demoId(10),
      read_at: null,
      created_at: now,
      actor: { display_name: "Ben" },
    },
  ],
}
