import { getContext, setContext } from "svelte"
import type { NotesService } from "../application/notes-service"
import type { NoteArrivals } from "../application/ports"

export interface NotesContext {
  readonly service: NotesService
  /** Fires when a note or a reply for the signed-in member arrives. */
  readonly arrivals: NoteArrivals
  /** The signed-in member's id. */
  readonly me: () => string
}

const KEY = Symbol("notes")

/** Called by src/app/composition/notes.ts with services bound to real adapters. */
export function provideNotes(value: NotesContext): void {
  setContext(KEY, value)
}

export function useNotes(): NotesContext {
  const value = getContext<NotesContext | undefined>(KEY)
  if (!value) throw new Error("Notes are not provided: call provideNotes in the composition root")
  return value
}

/** The context map for render({ context }) in component tests. */
export const notesContext = (value: NotesContext) => new Map([[KEY, value]])
