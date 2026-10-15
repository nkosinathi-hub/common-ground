import { describe, expect, it, vi } from "vitest"
import { toAttachmentsError } from "./attachments-errors"
import { SupabaseAttachmentsGateway, type AttachmentsDb } from "./supabase-attachments-gateway"

const httpError = (status: number, body: unknown) => ({
  name: "FunctionsHttpError",
  context: new Response(JSON.stringify(body), { status }),
})

function fakeDb(reply: { data: unknown; error: unknown }) {
  const query = {
    eq: vi.fn(() => query),
    order: vi.fn(() => Promise.resolve(reply)),
  }
  const db = {
    functions: { invoke: vi.fn(async () => reply) },
    from: vi.fn(() => ({ select: vi.fn(() => query) })),
    rpc: vi.fn(async () => reply),
  }
  return { db, query, gateway: new SupabaseAttachmentsGateway(db as unknown as AttachmentsDb) }
}

describe("SupabaseAttachmentsGateway", () => {
  it("lists ready rows of one idea through RLS", async () => {
    const row = { id: "a", space_id: "s", idea_id: "i", uploader_id: null, filename: "f.pdf" }
    const { db, query, gateway } = fakeDb({
      data: [{ ...row, verified_mime: "application/pdf", bytes: 5, created_at: "t" }],
      error: null,
    })
    expect(await gateway.list("s", "i")).toMatchObject({
      ok: true,
      value: [{ id: "a", mime: "application/pdf", uploaderId: null, bytes: 5 }],
    })
    expect(db.from).toHaveBeenCalledWith("attachments")
    expect(query.eq.mock.calls).toEqual([
      ["space_id", "s"],
      ["idea_id", "i"],
    ])
  })

  it("invokes the function per action and unwraps the download url", async () => {
    const { db, gateway } = fakeDb({ data: { url: "https://signed" }, error: null })
    expect(await gateway.signedUrl("a", "attachment")).toEqual({
      ok: true,
      value: "https://signed",
    })
    expect(db.functions.invoke).toHaveBeenCalledWith("attachments", {
      body: { action: "download", attachmentId: "a", disposition: "attachment" },
    })
    await gateway.finalize("a")
    expect(db.functions.invoke).toHaveBeenLastCalledWith("attachments", {
      body: { action: "finalize", attachmentId: "a" },
    })
  })

  it("deletes through the RPC and maps its errors", async () => {
    const { db, gateway } = fakeDb({ data: null, error: { code: "42501", message: "x" } })
    expect(await gateway.remove("a")).toMatchObject({ ok: false, error: { kind: "denied" } })
    expect(db.rpc).toHaveBeenCalledWith("delete_attachment", { target: "a" })
  })
})

describe("toAttachmentsError", () => {
  it("passes rejection reasons through and hides internal messages", async () => {
    const reason = "This file's contents do not match its type, so it was not attached"
    expect(
      await toAttachmentsError(httpError(400, { error: { kind: "validation", message: reason } })),
    ).toEqual({ kind: "validation", message: reason })
    expect(
      await toAttachmentsError(httpError(403, { error: { kind: "denied", message: "db" } })),
    ).toEqual({ kind: "denied", message: "You do not have access to this file" })
    expect((await toAttachmentsError({ name: "FunctionsFetchError" })).kind).toBe("network")
  })
})
