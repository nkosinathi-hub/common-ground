import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseAccountRepository } from "./supabase-account-repository"

/** The repository over a client that records each call and answers every await with `reply`. */
function recordingDb(reply: Reply) {
  const { calls, client } = recordingClient(reply)
  return { calls, repo: new SupabaseAccountRepository(client as Db) }
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
