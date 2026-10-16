import type { DraftsService } from "../application/drafts-service"
import { validateHardTalk } from "../domain"
import type { ComposerState } from "./composer.svelte"
import type { NotesState } from "./notes-state.svelte"

/** Sends a quick note; true once it is sent. */
export async function sendQuick(composer: ComposerState, notes: NotesState): Promise<boolean> {
  const { to, body, pinned, expiry } = composer
  composer.sending = true
  const failure = await notes.send({ recipientId: to || null, body, pinned, expiry })
  composer.sending = false
  composer.error = failure?.message ?? null
  if (failure) return false
  await composer.dropDraft()
  return true
}

/** Saves the draft as written, then sends it; true once it is sent. */
export async function sendHardTalk(
  composer: ComposerState,
  notes: NotesState,
  drafts: DraftsService,
  spaceId: string,
): Promise<boolean> {
  const fields = composer.fields()
  const valid = validateHardTalk(fields.sections, composer.to)
  composer.error = valid.ok ? null : valid.error.message
  if (!valid.ok) return false
  composer.sending = true
  composer.edited()
  const saved = await composer.autosave.flush()
  const id = composer.autosave.id
  if (saved && id) {
    composer.autosave.stop()
    const failure = await notes.added(drafts.send(spaceId, id, fields))
    composer.error = failure?.message ?? null
    if (failure) composer.autosave.resume()
  } else composer.error = "Couldn't save. Trying again"
  composer.sending = false
  return composer.error === null
}
