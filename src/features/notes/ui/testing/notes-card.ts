import {
  fireEvent,
  render,
  screen,
  within,
  type BoundFunctions,
  type queries,
} from "@testing-library/svelte"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideNotes, type NotesContext } from "../context"
import NotesCard from "../NotesCard.svelte"

export type Dialog = BoundFunctions<typeof queries>

/** Renders the notes card in space "s" with these services (a notesHarness's `services`). */
export function renderNotesCard(services: NotesContext, writing = false): void {
  const props = { spaceId: "s", writing }
  render(Provided, {
    props: { provide: () => provideNotes(services), component: NotesCard, props },
  })
}

/** Renders the card with the composer open, as the header's Write a note does; returns it. */
export async function openComposer(services: NotesContext): Promise<Dialog> {
  renderNotesCard(services, true)
  return within(await screen.findByRole("dialog", { name: COMPOSER }))
}

/** The composer is named for the kind of note it holds (S01, S02a). */
export const COMPOSER = /Leave a little note|Something on my mind/

/** One of the composer's kind choices ("Quick note", "Something on my mind"). */
export const mode = (dialog: Dialog, name: string) => dialog.getByRole("radio", { name })

/** Moves "Something on my mind" on by its Next button, `times` steps. */
export async function next(dialog: Dialog, times = 1): Promise<void> {
  for (let i = 0; i < times; i++)
    await fireEvent.click(dialog.getByRole("button", { name: "Next" }))
}
