import { describe, expect, it } from "vitest"
import { DEFAULT_LOOK } from "../../domain/space-look"
import { LookDraft } from "./look-draft.svelte"

describe("LookDraft", () => {
  it("is dirty after a change and clean again when reset matches what is saved", () => {
    const draft = new LookDraft(() => DEFAULT_LOOK)
    expect(draft.dirty).toBe(false)
    draft.set("corners", "rounded")
    expect(draft.look.corners).toBe("rounded")
    expect(draft.dirty).toBe(true)
    draft.reset()
    expect(draft.dirty).toBe(false)
  })

  it("starts from the saved look", () => {
    const saved = { ...DEFAULT_LOOK, button: "#1e6b66" }
    const draft = new LookDraft(() => saved)
    expect(draft.look.button).toBe("#1e6b66")
    draft.reset()
    expect(draft.dirty).toBe(true)
  })
})
