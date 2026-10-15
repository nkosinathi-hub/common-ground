import { describe, expect, it } from "vitest"
import { appError, err, ok } from "@/shared/domain"
import { FormState } from "./form-state.svelte"

describe("FormState", () => {
  it("tracks pending and splits field from form errors", async () => {
    const form = new FormState()
    const run = form.run(async () => err(appError("validation", "Too short", "password")))
    expect(form.pending).toBe(true)
    await run
    expect(form.pending).toBe(false)
    expect(form.fieldError("password")).toBe("Too short")
    expect(form.formError).toBeUndefined()
    await form.run(async () => err(appError("network", "Offline")))
    expect(form.formError).toBe("Offline")
    await form.run(async () => ok(1))
    expect(form.error).toBeNull()
  })
})
