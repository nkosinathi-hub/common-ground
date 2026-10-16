import type { MemberRef } from "@/shared/domain"
import { EMPTY_DRAFT, type DraftFields } from "../domain"
import { inMemoryNotesService } from "./notes-fixture"

/** In-memory notes for component tests as `me`; `services` goes to provideNotes. */
export function notesHarness(me = "ana", members?: MemberRef[]) {
  const fixture = inMemoryNotesService(members)
  fixture.repo.me = me
  let arrive = () => {}
  const arrivals = { subscribe: (cb: () => void) => ((arrive = cb), () => {}) }
  const { service, drafts, hardTalk } = fixture
  const services = { service, drafts, hardTalk, arrivals, me: () => me }
  /** Sends a "Something on my mind" note as `from`, then switches back to `me`. */
  async function share(from: string, fields: Partial<DraftFields>) {
    fixture.repo.me = from
    const all = { ...EMPTY_DRAFT, ...fields }
    const id = await drafts.save("s", null, all)
    if (id.ok) await drafts.send("s", id.value, all)
    fixture.repo.me = me
  }
  return { ...fixture, services, share, arrive: () => arrive() }
}
