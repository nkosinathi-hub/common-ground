import { describe, expect, it } from "vitest"
import { toFunctionError } from "@/shared/infrastructure/functions"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { ATTACHMENTS_COPY } from "./attachments-errors"
import { SupabaseAttachmentsGateway } from "./supabase-attachments-gateway"

const httpError = (status: number, body: unknown) => ({
  name: "FunctionsHttpError",
  context: new Response(JSON.stringify(body), { status }),
})

function setup(reply: Reply) {
  const { calls, client } = recordingClient(reply)
  return { calls, gateway: new SupabaseAttachmentsGateway(client as Db) }
}

describe("SupabaseAttachmentsGateway", () => {
  it("lists rows of one idea through RLS, skipping any without an allowed type", async () => {
    const row = { id: "a", space_id: "s", idea_id: "i", uploader_id: null, filename: "f.pdf" }
    const pdf = { ...row, verified_mime: "application/pdf", bytes: 5, created_at: "t" }
    const { calls, gateway } = setup({
      data: [pdf, { ...pdf, id: "b", verified_mime: "image/svg+xml" }],
      error: null,
    })
    expect(await gateway.list("s", "i")).toMatchObject({
      ok: true,
      value: [{ id: "a", mime: "application/pdf", uploaderId: null, bytes: 5 }],
    })
    expect(calls[0]).toEqual(["from", "attachments"])
    expect(calls.slice(2)).toEqual([
      ["eq", "space_id", "s"],
      ["eq", "idea_id", "i"],
      ["order", "created_at", { ascending: true }],
    ])
  })

  it("invokes the function per action and unwraps the download url", async () => {
    const { calls, gateway } = setup({ data: { url: "https://signed" }, error: null })
    expect(await gateway.signedUrl("a", "attachment")).toEqual({
      ok: true,
      value: "https://signed",
    })
    await gateway.finalize("a")
    expect(calls).toEqual([
      [
        "invoke",
        "attachments",
        { body: { action: "download", attachmentId: "a", disposition: "attachment" } },
      ],
      ["invoke", "attachments", { body: { action: "finalize", attachmentId: "a" } }],
    ])
  })

  it("deletes through the RPC and maps its errors", async () => {
    const { calls, gateway } = setup({ data: null, error: { code: "42501", message: "x" } })
    expect(await gateway.remove("a")).toMatchObject({ ok: false, error: { kind: "denied" } })
    expect(calls).toEqual([["rpc", "delete_attachment", { target: "a" }]])
  })
})

describe("attachments copy", () => {
  const toAttachmentsError = (error: unknown) => toFunctionError(error, ATTACHMENTS_COPY)

  it("passes rejection reasons through and hides internal messages", async () => {
    const reason = "This file's contents do not match its type, so it was not attached"
    expect(
      await toAttachmentsError(httpError(400, { error: { kind: "validation", message: reason } })),
    ).toEqual({ kind: "validation", message: reason })
    expect(
      await toAttachmentsError(httpError(403, { error: { kind: "denied", message: "db" } })),
    ).toEqual({ kind: "denied", message: "You do not have access to this file" })
    const pause = "A little pause: try again in a minute"
    expect(
      await toAttachmentsError(httpError(429, { error: { kind: "rate_limited", message: pause } })),
    ).toEqual({ kind: "rate_limited", message: pause })
    expect((await toAttachmentsError({ name: "FunctionsFetchError" })).kind).toBe("network")
  })
})
