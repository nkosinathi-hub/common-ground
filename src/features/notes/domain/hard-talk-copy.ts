import type { RemindIn, ResponseKind, ResponseWish, SectionKey, SupportWish } from "./hard-talk"

export const MODES = [
  { value: "note", label: "A quick note" },
  { value: "hard_talk", label: "Something on my mind" },
] as const

export const COMPOSER_INTRO =
  "Write as much or as little as you like. Every part is optional. Only you can see this until you send it."
export const TO_HINT = "Write it however it comes, in any language."

export const SECTION_COPY: Record<SectionKey, { label: string; placeholder: string }> = {
  happened: {
    label: "What's on my mind",
    placeholder: "What happened, or what I keep thinking about. Just what you saw or heard.",
  },
  feel: { label: "How I feel", placeholder: "I feel… (a word or two is plenty)" },
  matters: { label: "What matters to me", placeholder: "What I need, or why this matters to me" },
  help: {
    label: "What would help",
    placeholder: "One thing that would help, if you know. It's okay if you don't.",
  },
}

export const FEELING_WORDS = [
  "hurt",
  "sad",
  "lonely",
  "worried",
  "frustrated",
  "disappointed",
  "overwhelmed",
  "left out",
  "tired",
  "confused",
  "embarrassed",
  "angry",
  "torn",
  "hopeful",
  "grateful",
  "not sure yet",
] as const

export const I_TIP =
  'Starting with "I" helps, like "I felt left out when…". It\'s easier to hear than "You always…".'

/** The writer's choice, then the line the reader sees ("any" shows none). */
export const RESPONSE_WISHES: readonly { value: ResponseWish; label: string }[] = [
  { value: "talk", label: "Can we talk in person?" },
  { value: "write", label: "Write back when you're ready" },
  { value: "read", label: "I just need you to read it" },
  { value: "any", label: "Whatever feels right" },
]

export const SUPPORT_WISHES: readonly { value: SupportWish; label: string }[] = [
  { value: "listen", label: "Mostly, just listen" },
  { value: "solve", label: "Help me work it out" },
]

export function wishLine(wish: ResponseWish, name: string): string | null {
  if (wish === "talk")
    return `${name} would like to talk about this in person, when you're both ready.`
  if (wish === "write") return `${name} would like you to write back when you're ready.`
  return wish === "read" ? `${name} just needs you to read it. No reply needed.` : null
}

export const supportLine = (wish: SupportWish, name: string) =>
  wish === "listen"
    ? `Right now ${name} mostly wants to be heard.`
    : `${name} would like to work it out together.`

export const RESPONSES: readonly { value: ResponseKind; label: string }[] = [
  { value: "here", label: "I've read it, and I'm here" },
  { value: "time", label: "I need a little time. I'll come back to this" },
  { value: "talk", label: "Let's talk" },
  { value: "thanks", label: "Thank you for telling me" },
]

export const responseLabel = (kind: ResponseKind) =>
  RESPONSES.find((r) => r.value === kind)?.label ?? ""

export const REMINDERS: readonly { days: RemindIn | null; label: string }[] = [
  { days: 1, label: "Tomorrow" },
  { days: 3, label: "In 3 days" },
  { days: null, label: "No thanks" },
]

export const TALK_TIP =
  "When you talk, take turns listening first. If it gets heated, it's okay to pause for 20 minutes or so and come back."

export const SAVE_STATUS = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save. Trying again",
}
