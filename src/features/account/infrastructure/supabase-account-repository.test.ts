import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { SupabaseAccountRepository } from "./supabase-account-repository"

type Reply = { data: unknown; error: unknown }

/** Typed-client stand-in: records each call and answers every query with one reply. */
function recordingDb(reply: Reply) {
  const calls: unknown[][] = []
  const chain: Record<string, unknown> = {
    then: (resolve: (value: Reply) => void) => resolve(reply),
  }
  for (const name of ["from", "update", "eq"])
    chain[name] = (...args: unknown[]) => {
      calls.push([name, ...args])
      return chain
    }
  const rpc = async (...args: unknown[]) => {
    calls.push(["rpc", ...args])
    return reply
  }
  return { calls, repo: new SupabaseAccountRepository({ ...chain, rpc } as unknown as Db) }
}

describe("SupabaseAccountRepository", () => {
  it("exports a space and my data through their RPCs, passing the JSON through", async () => {
    const { calls, repo } = recordingDb({ data: { space: { name: "Us" } }, error: null })
    expect(await repo.exportSpace("s1")).toEqual({ ok: true, value: { space: { name: "Us" } } })
    expect(await repo.exportMe()).toMatchObject({ ok: true })
    expect(calls).toEqual([
      ["rpc", "export_space", { target_space: "s1" }],
      ["rpc", "export_me"],
    ])
  })

  it("deletes my account and surfaces the server's refusal", async () => {
    const message = "transfer ownership or delete your shared spaces first"
    const { calls, repo } = recordingDb({ data: null, error: { code: "P0001", message } })
    expect(await repo.deleteMe()).toEqual({ ok: false, error: { kind: "validation", message } })
    expect(calls).toEqual([["rpc", "delete_my_account"]])
  })

  it("renames only my own profile row", async () => {
    const { calls, repo } = recordingDb({ data: null, error: null })
    expect(await repo.updateDisplayName("u1", "Ana")).toEqual({ ok: true, value: undefined })
    expect(calls).toEqual([
      ["from", "profiles"],
      ["update", { display_name: "Ana" }],
      ["eq", "id", "u1"],
    ])
  })

  it("maps a denied export to a user-safe error", async () => {
    const { repo } = recordingDb({ data: null, error: { code: "42501", message: "rls" } })
    expect(await repo.exportSpace("s2")).toMatchObject({ ok: false, error: { kind: "denied" } })
  })
})
