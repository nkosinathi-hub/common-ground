import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { SupabaseSpaceMedia } from "./supabase-space-media"

type Call = [string, ...unknown[]]

function storageDb(reply: { data?: unknown; error?: unknown }) {
  const calls: Call[] = []
  const answer = async () => ({ data: reply.data ?? null, error: reply.error ?? null })
  const bucket = {
    upload: (...args: unknown[]) => (calls.push(["upload", ...args]), answer()),
    remove: (...args: unknown[]) => (calls.push(["remove", ...args]), answer()),
    createSignedUrls: (...args: unknown[]) => (calls.push(["sign", ...args]), answer()),
  }
  const db = { storage: { from: (name: string) => (calls.push(["from", name]), bucket) } }
  return { media: new SupabaseSpaceMedia(db as unknown as Db), calls }
}

describe("SupabaseSpaceMedia", () => {
  it("uploads WebP without overwriting into the private space-media bucket", async () => {
    const { media, calls } = storageDb({})
    const file = new Blob(["x"], { type: "image/webp" })
    expect((await media.upload("s1/cover/u.webp", file)).ok).toBe(true)
    expect(calls).toEqual([
      ["from", "space-media"],
      ["upload", "s1/cover/u.webp", file, { contentType: "image/webp", upsert: false }],
    ])
  })

  it("maps storage failures to app errors", async () => {
    const { media } = storageDb({ error: { message: "quota", status: 403 } })
    expect((await media.upload("p", new Blob())).ok).toBe(false)
    expect((await media.remove(["p"])).ok).toBe(false)
  })

  it("removes objects, skipping an empty list", async () => {
    const { media, calls } = storageDb({})
    expect((await media.remove([])).ok).toBe(true)
    expect(calls).toEqual([])
    await media.remove(["a", "b"])
    expect(calls).toContainEqual(["remove", ["a", "b"]])
  })

  it("signs a batch and leaves out paths that failed", async () => {
    const data = [
      { path: "a", signedUrl: "https://x/a", error: null },
      { path: "b", signedUrl: "", error: "not found" },
    ]
    const { media, calls } = storageDb({ data })
    expect(await media.sign(["a", "b"], 3600)).toEqual({ ok: true, value: { a: "https://x/a" } })
    expect(calls).toContainEqual(["sign", ["a", "b"], 3600])
    expect(await media.sign([], 3600)).toEqual({ ok: true, value: {} })
  })
})
