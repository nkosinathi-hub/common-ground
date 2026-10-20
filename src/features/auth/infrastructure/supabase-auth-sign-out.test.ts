import { describe, expect, it, vi } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { SupabaseAuthGateway } from "./supabase-auth-gateway"

describe("SupabaseAuthGateway sign-out", () => {
  it("passes the scope through, and signs out only this device by default", async () => {
    const signOut = vi.fn(async () => ({ error: null }))
    const gateway = new SupabaseAuthGateway({ auth: { signOut } } as unknown as Db)
    expect((await gateway.signOut()).ok).toBe(true)
    expect((await gateway.signOut("global")).ok).toBe(true)
    expect(signOut.mock.calls).toEqual([[{ scope: "local" }], [{ scope: "global" }]])
  })
})
