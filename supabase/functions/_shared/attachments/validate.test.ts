import { describe, expect, it } from "vitest"
import { parseRequest } from "./validate.ts"

const spaceId = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
const ideaId = "1b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f61"
const attachmentId = "2B9C2F6E-6A43-4C8E-9F0A-3D2B1C4E5F62"

describe("parseRequest", () => {
  it("parses start with its upload intent", () => {
    const body = {
      action: "start",
      spaceId,
      ideaId,
      filename: "a.pdf",
      mime: "application/pdf",
      bytes: 9,
    }
    expect(parseRequest(body)).toEqual({ ok: true, value: body })
  })

  it("requires uuids and typed fields for start", () => {
    const base = { action: "start", spaceId, ideaId, filename: "a.pdf", mime: "application/pdf" }
    expect(parseRequest({ ...base, bytes: "9" })).toMatchObject({ ok: false })
    expect(parseRequest({ ...base, bytes: 9, filename: 1 })).toMatchObject({ ok: false })
    expect(parseRequest({ ...base, bytes: 9, ideaId: "x" })).toEqual({
      ok: false,
      message: "Choose an idea first",
    })
  })

  it("parses finalize and download, lower-casing the id", () => {
    const id = attachmentId.toLowerCase()
    expect(parseRequest({ action: "finalize", attachmentId })).toEqual({
      ok: true,
      value: { action: "finalize", attachmentId: id },
    })
    expect(parseRequest({ action: "download", attachmentId })).toEqual({
      ok: true,
      value: { action: "download", attachmentId: id, disposition: "inline" },
    })
    expect(
      parseRequest({ action: "download", attachmentId, disposition: "attachment" }),
    ).toMatchObject({
      ok: true,
      value: { disposition: "attachment" },
    })
  })

  it("rejects bad ids, dispositions, actions and bodies", () => {
    expect(parseRequest({ action: "finalize", attachmentId: "../x" })).toMatchObject({ ok: false })
    expect(parseRequest({ action: "download", attachmentId, disposition: "evil" })).toMatchObject({
      ok: false,
    })
    expect(parseRequest({ action: "upload" })).toEqual({
      ok: false,
      message: "Unknown attachments action",
    })
    expect(parseRequest(null)).toEqual({ ok: false, message: "Invalid request" })
    expect(parseRequest({ action: "cleanup" })).toEqual({ ok: true, value: { action: "cleanup" } })
  })
})
