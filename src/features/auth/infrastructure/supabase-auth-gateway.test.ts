import { describe, expect, it, vi } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { SupabaseAuthGateway } from "./supabase-auth-gateway"

const user = { id: "u1", email: "ana@x.co", user_metadata: {}, email_confirmed_at: "2026-10-15" }
const failure = (error: object) => ({ data: { user: null }, error })

/** Stand-in for supabase.auth: every method resolves to the reply given for it. */
function stub(auth: Record<string, unknown>) {
  const calls: unknown[][] = []
  const recorded = Object.fromEntries(
    Object.entries(auth).map(([name, reply]) => [
      name,
      vi.fn(async (...args: unknown[]) => {
        calls.push([name, ...args])
        return reply
      }),
    ]),
  )
  return { gateway: new SupabaseAuthGateway({ auth: recorded } as unknown as Db), calls }
}

describe("SupabaseAuthGateway", () => {
  it("signs up with the display name and redirect in the request", async () => {
    const { gateway, calls } = stub({ signUp: { data: {}, error: null } })
    const request = { email: "a@x.co", password: "p", displayName: "Ana", redirectTo: "r" }
    expect(await gateway.signUp(request)).toEqual({ ok: true, value: undefined })
    expect(calls[0]?.[1]).toEqual({
      email: "a@x.co",
      password: "p",
      options: { emailRedirectTo: "r", data: { display_name: "Ana" } },
    })
  })

  it("tells an unconfirmed email, an outage and a wrong password apart", async () => {
    const unconfirmed = stub({ signInWithPassword: failure({ code: "email_not_confirmed" }) })
    expect(await unconfirmed.gateway.signIn("a", "b")).toMatchObject({ error: { kind: "denied" } })
    const outage = stub({ signInWithPassword: failure({ status: 503 }) })
    expect(await outage.gateway.signIn("a", "b")).toMatchObject({ error: { kind: "network" } })
    const wrong = stub({ signInWithPassword: failure({ status: 400 }) })
    expect(await wrong.gateway.signIn("a", "b")).toMatchObject({
      error: { kind: "unauthenticated" },
    })
  })

  it("maps the signed-in user, falling back to the email name", async () => {
    const { gateway } = stub({ signInWithPassword: { data: { user }, error: null } })
    expect(await gateway.signIn("ana@x.co", "p")).toEqual({
      ok: true,
      value: { id: "u1", email: "ana@x.co", displayName: "ana", emailConfirmed: true },
    })
  })

  it("asks a signed-out caller to sign in again before reauthenticating", async () => {
    const { gateway } = stub({ getSession: { data: { session: null } } })
    expect(await gateway.reauthenticate("p")).toMatchObject({
      error: { kind: "unauthenticated" },
    })
  })

  it("reads a used or expired code as an expired link", async () => {
    const { gateway } = stub({ exchangeCodeForSession: failure({ status: 400 }) })
    expect(await gateway.exchangeCode("c")).toMatchObject({ error: { kind: "validation" } })
  })

  it("maps auth events and ignores ones the app does not use", () => {
    const listener = vi.fn()
    let emit: (event: string, session: unknown) => void = () => {}
    const unsubscribe = vi.fn()
    const onAuthStateChange = (callback: typeof emit) => {
      emit = callback
      return { data: { subscription: { unsubscribe } } }
    }
    const gateway = new SupabaseAuthGateway({ auth: { onAuthStateChange } } as unknown as Db)
    const stop = gateway.onChange(listener)
    emit("TOKEN_REFRESHED", { user })
    emit("INITIAL_SESSION", null)
    stop()
    expect(listener.mock.calls).toEqual([["refreshed", expect.objectContaining({ id: "u1" })]])
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
