import { describe, expect, it } from "vitest"
import { recordingClient } from "./recording-client"

interface Chain extends PromiseLike<unknown> {
  from(...args: unknown[]): Chain
  select(...args: unknown[]): Chain
  eq(...args: unknown[]): Chain
  rpc(...args: unknown[]): Chain
}
type Client = Chain & {
  auth: { getUser(): Promise<unknown> }
  functions: { invoke(...args: unknown[]): Promise<unknown> }
}

describe("recordingClient", () => {
  it("records every builder call and answers each await with the one reply", async () => {
    const reply = { data: [1], error: null }
    const { calls, client } = recordingClient(reply)
    const db = client as Client
    expect(await db.from("ideas").select("id").eq("id", "i1")).toEqual(reply)
    expect(await db.rpc("export_me")).toEqual(reply)
    expect(calls).toEqual([
      ["from", "ideas"],
      ["select", "id"],
      ["eq", "id", "i1"],
      ["rpc", "export_me"],
    ])
  })

  it("hands out queued replies in await order, then empty ones", async () => {
    const first = { data: 1, error: null }
    const second = { data: null, error: { code: "42501" } }
    const db = recordingClient([first, second]).client as Client
    expect(await db.rpc("a")).toEqual(first)
    expect(await db.from("t").select()).toEqual(second)
    expect(await db.from("t")).toEqual({ data: null, error: null })
  })

  it("records Edge Function calls and answers them from the same queue", async () => {
    const reply = { data: { url: "u" }, error: null }
    const { calls, client } = recordingClient([reply])
    const db = client as Client
    expect(await db.functions.invoke("attachments", { body: { a: 1 } })).toEqual(reply)
    expect(calls).toEqual([["invoke", "attachments", { body: { a: 1 } }]])
  })

  it("is signed in as u1 by default, as given, or signed out", async () => {
    const user = async (userId?: string | null) =>
      (recordingClient([], userId).client as Client).auth.getUser()
    expect(await user()).toEqual({ data: { user: { id: "u1" } }, error: null })
    expect(await user("u9")).toEqual({ data: { user: { id: "u9" } }, error: null })
    expect(await user(null)).toEqual({ data: { user: null }, error: null })
  })
})
