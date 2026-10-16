import { appError, err, ok, type Result } from "@/shared/domain"

/** The four optional parts of a "Something on my mind" note, in writing order. */
export const SECTION_KEYS = ["happened", "feel", "matters", "help"] as const
export type SectionKey = (typeof SECTION_KEYS)[number]
export type Sections = Partial<Record<SectionKey, string>>

export type NoteKind = "note" | "hard_talk"
export type ResponseWish = "talk" | "write" | "read" | "any"
export type SupportWish = "listen" | "solve"
export type ResponseKind = "here" | "time" | "talk" | "thanks"
/** Days until a gentle reminder, after "I need a little time". */
export type RemindIn = 1 | 3

export const SECTION_MAX = 500
const COUNTER_FROM = 400

/** The parts that have words, trimmed, in writing order. */
export const filledSections = (sections: Sections): [SectionKey, string][] =>
  SECTION_KEYS.flatMap((key): [SectionKey, string][] => {
    const text = sections[key]?.trim() ?? ""
    return text ? [[key, text]] : []
  })

/** Needs a recipient, and words in at least one part of at most 500 characters. */
export function validateHardTalk(sections: Sections, to: string): Result<Sections> {
  if (!to) return err(appError("validation", "Choose who this is for", "to"))
  const long = SECTION_KEYS.find((key) => (sections[key]?.length ?? 0) > SECTION_MAX)
  if (long) return err(appError("validation", "Each part is at most 500 characters", long))
  if (filledSections(sections).length === 0)
    return err(appError("validation", "Write something in at least one part", "sections"))
  return ok(sections)
}

/** The character counter only appears close to the limit. */
export const showCounter = (text: string) => text.length > COUNTER_FROM

/** Inserts a feeling word at the cursor with a space on either side as needed. */
export function insertWord(text: string, word: string, cursor: number) {
  const before = text.slice(0, cursor)
  const after = text.slice(cursor)
  const lead = before && !before.endsWith(" ") ? " " : ""
  const trail = after && !after.startsWith(" ") ? " " : ""
  const next = `${before}${lead}${word}${trail}${after}`
  if (next.length > SECTION_MAX) return { text, cursor }
  return { text: next, cursor: before.length + lead.length + word.length }
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "just now", "5m ago", "2h ago", "3d ago". */
export function editedAgo(iso: string, now: Date): string {
  const gone = Math.max(0, now.getTime() - Date.parse(iso))
  if (gone < MINUTE) return "just now"
  if (gone < HOUR) return `${Math.floor(gone / MINUTE)}m ago`
  if (gone < DAY) return `${Math.floor(gone / HOUR)}h ago`
  return `${Math.floor(gone / DAY)}d ago`
}
