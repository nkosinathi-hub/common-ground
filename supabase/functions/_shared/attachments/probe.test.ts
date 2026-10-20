import { describe, expect, it, vi } from "vitest"
import { PROBE_BYTES } from "./magic.ts"
import { fetchProbe, readProbe } from "./probe.ts"
import { SAMPLES } from "./samples.ts"

const OBJECT_SIZE = 5000
const body = new Uint8Array(PROBE_BYTES * 2).fill(7)
const reply = (status: number, contentRange: string | null, contentLength: string | null) => ({
  status,
  contentRange,
  contentLength,
  body,
})

describe("readProbe", () => {
  it("reads the total size from a 206 Content-Range", () => {
    const range = `bytes 0-${PROBE_BYTES - 1}/${OBJECT_SIZE}`
    const probe = readProbe(reply(206, range, String(PROBE_BYTES)), PROBE_BYTES)
    expect(probe?.total).toBe(OBJECT_SIZE)
    expect(probe?.head).toHaveLength(PROBE_BYTES)
  })

  it("accepts a 200 from a server that ignores Range", () => {
    expect(readProbe(reply(200, null, String(body.length)), PROBE_BYTES)).toEqual({
      head: body.slice(0, PROBE_BYTES),
      total: body.length,
    })
    expect(readProbe(reply(200, null, null), PROBE_BYTES)?.total).toBe(body.length)
  })

  it("treats missing objects and malformed ranges as no object", () => {
    expect(readProbe(reply(404, null, null), PROBE_BYTES)).toBeNull()
    expect(readProbe(reply(400, null, null), PROBE_BYTES)).toBeNull()
    expect(readProbe(reply(206, "bytes */5", null), PROBE_BYTES)).toBeNull()
  })
})

describe("fetchProbe", () => {
  it("asks for the leading bytes only and reads the reply", async () => {
    const headers = { "content-range": `bytes 0-${PROBE_BYTES - 1}/${OBJECT_SIZE}` }
    const send = vi.fn(async () => new Response(SAMPLES.png, { status: 206, headers }))
    const probe = await fetchProbe(send, "https://storage.test/sign/a")
    expect(probe).toEqual({ head: SAMPLES.png, total: OBJECT_SIZE })
    const [, init] = send.mock.calls[0] as unknown as [string, RequestInit]
    expect(new Headers(init.headers).get("range")).toBe(`bytes=0-${PROBE_BYTES - 1}`)
  })

  it("gives up on a storage read that runs past the timeout", async () => {
    const hanging = (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) =>
        init.signal?.addEventListener("abort", () => reject(init.signal?.reason as DOMException)),
      )
    await expect(fetchProbe(hanging, "https://storage.test/sign/a", 5)).rejects.toThrow()
  })
})
