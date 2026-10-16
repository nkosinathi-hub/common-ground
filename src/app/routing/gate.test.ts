import { describe, expect, it } from "vitest"
import type { SessionStore } from "@/features/auth"
import type { SpacesStore } from "@/features/spaces"
import { RouteGate } from "./gate.svelte"
import type { Router } from "./router.svelte"

const user = { id: "u1", email: "a@b.c", displayName: "Ana" }
function gateWith(spaces: Partial<SpacesStore>, signedIn = true) {
  const router = { route: { name: "entry" } } as unknown as Router
  const session = { user: signedIn ? user : null } as unknown as SessionStore
  return new RouteGate(router, session, { spaces: [], active: null, ...spaces } as SpacesStore)
}

describe("RouteGate failure", () => {
  it("fails when memberships could not load and none are known", () => {
    expect(gateWith({ status: "error" }).failed).toBe(true)
  })

  it("keeps working on known spaces when a later refresh fails", () => {
    const spaces = [{ id: "s1" }] as SpacesStore["spaces"]
    expect(gateWith({ status: "error", spaces }).failed).toBe(false)
  })

  it("never fails for loaded memberships or signed-out visitors", () => {
    expect(gateWith({ status: "ready" }).failed).toBe(false)
    expect(gateWith({ status: "error" }, false).failed).toBe(false)
  })
})
