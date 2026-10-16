import { responseLabel } from "./hard-talk-copy"
import type { Note } from "./note"

type Shared = Pick<Note, "authorId" | "authorName" | "recipient">

const recipientName = (note: Pick<Note, "recipient">) =>
  note.recipient.kind === "member" ? note.recipient.name : ""

/** "Ana shared something with you" or "You shared something with Ben". Never the content. */
export const hardTalkTitle = (note: Shared, me: string) =>
  note.authorId === me
    ? `You shared something with ${recipientName(note)}`
    : `${note.authorName} shared something with you`

/** What the author sees: no read receipt, only the responses the reader chose to send. */
export function authorStatus(note: Pick<Note, "recipient" | "latestResponse">): string {
  const name = recipientName(note)
  return note.latestResponse
    ? `${name}: ${responseLabel(note.latestResponse.kind)}`
    : `No rush. ${name} hasn't responded yet`
}

/** Waiting at the top of the recipient's Home until they open it. */
export const isWaitingFor = (note: Pick<Note, "kind" | "recipient" | "readAt">, me: string) =>
  note.kind === "hard_talk" &&
  note.recipient.kind === "member" &&
  note.recipient.id === me &&
  note.readAt === null
