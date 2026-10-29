import { ANA, BEN, SPACE, demoId } from "./identity"

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
const TED_LASSO = demoId(10)

/**
 * Ted Lasso's discussion: Ana is at S1E2, so Ben's E3 and E4 thoughts wait behind the spoiler
 * notice, and the E2 talk shows hearts and a reply. The idea keeps its one untagged comment.
 */
const seeds = [
  {
    n: 60,
    item: TED_LASSO,
    by: BEN,
    at: 30,
    tag: 2,
    body: "Favourite moment: the biscuits. Every single box.",
    hearts: [ANA],
    replies: 1,
  },
  {
    n: 61,
    item: null,
    by: BEN,
    at: 26,
    tag: null,
    body: "I can research the campsites this weekend.",
    hearts: [],
    replies: 0,
  },
  {
    n: 62,
    item: TED_LASSO,
    by: ANA,
    at: 50,
    tag: 1,
    body: '"I believe in believe." Already on the fridge.',
    hearts: [BEN],
    replies: 0,
  },
  {
    n: 63,
    item: TED_LASSO,
    by: BEN,
    at: 5,
    tag: 3,
    body: "Theory: Rebecca let Trent in on purpose.",
    hearts: [],
    replies: 0,
  },
  {
    n: 64,
    item: TED_LASSO,
    by: BEN,
    at: 2,
    tag: 4,
    body: "The darts scene. I will say no more.",
    hearts: [],
    replies: 0,
  },
]

export const commentRows = [
  ...seeds.map((s) => ({
    id: demoId(s.n),
    space_id: SPACE,
    watch_item_id: s.item,
    idea_id: s.item ? null : demoId(20),
    author_id: s.by,
    body: s.body,
    spoiler: false,
    edited: false,
    created_at: hoursAgo(s.at),
    reply_to: null,
    season: s.tag === null ? null : 1,
    episode: s.tag,
    comment_mentions: [],
    comment_reactions: s.hearts.map((user_id) => ({ user_id })),
    replies: [{ count: s.replies }],
  })),
  {
    id: demoId(67),
    space_id: SPACE,
    watch_item_id: TED_LASSO,
    idea_id: null,
    author_id: ANA,
    body: "Same. I want a box.",
    spoiler: false,
    edited: false,
    created_at: hoursAgo(28),
    reply_to: demoId(60),
    season: 1,
    episode: 2,
    comment_mentions: [],
    comment_reactions: [],
    replies: [{ count: 0 }],
  },
]
