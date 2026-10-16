import { getContext, setContext } from "svelte"
import type { DraftsService } from "../application/drafts-service"
import type { HardTalkService } from "../application/hard-talk-service"
import type { NotesService } from "../application/notes-service"
import type { NoteArrivals } from "../application/ports"
import { NoteChanges } from "./note-changes"

export interface NotesContext {
  readonly service: NotesService
  readonly drafts: DraftsService
  readonly hardTalk: HardTalkService
  /** Fires when a note, a reply or a response for the signed-in member arrives. */
  readonly arrivals: NoteArrivals
  /** The signed-in member's id. */
  readonly me: () => string
}

export type ProvidedNotes = NotesContext & { readonly changes: NoteChanges }

const KEY = Symbol("notes")

const withChanges = (value: NotesContext): ProvidedNotes => ({
  ...value,
  changes: new NoteChanges(),
})

/** Called by src/app/composition/notes.ts with services bound to real adapters. */
export function provideNotes(value: NotesContext): void {
  setContext(KEY, withChanges(value))
}

export function useNotes(): ProvidedNotes {
  const value = getContext<ProvidedNotes | undefined>(KEY)
  if (!value) throw new Error("Notes are not provided: call provideNotes in the composition root")
  return value
}
