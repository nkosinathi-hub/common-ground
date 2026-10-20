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
export function renderNotesCard(services: NotesContext): void {
  render(Provided, {
    props: { provide: () => provideNotes(services), component: NotesCard, props: { spaceId: "s" } },
  })
}

/** Renders the card and opens the composer; returns its dialog. */
export async function openComposer(services: NotesContext): Promise<Dialog> {
  renderNotesCard(services)
  await fireEvent.click(await screen.findByRole("button", { name: "Write a note" }))
  return within(await screen.findByRole("dialog", { name: "Write a note" }))
}

/** One of the composer's mode radios ("A quick note", "Something on my mind"). */
export const mode = (dialog: Dialog, name: string) => dialog.getByRole("radio", { name })
