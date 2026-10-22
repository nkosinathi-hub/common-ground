import { describe, expect, it } from "vitest"
import {
  BRIDGE,
  parseSeekReply,
  parseSeekRequest,
  seekReply,
  seekRequest,
  type BridgeEvent,
} from "./bridge"

const page = {}
const from = (data: unknown, extra: Partial<BridgeEvent> = {}): BridgeEvent => ({
  data,
  origin: "https://www.netflix.com",
  source: page,
  ...extra,
})

describe("the seek bridge between the content script and the page", () => {
  it("carries a seek in whole milliseconds and its reply", () => {
    expect(seekRequest(3, 1234.6)).toEqual({ channel: BRIDGE, kind: "seek", id: 3, ms: 1235 })
    expect(parseSeekRequest(from(seekRequest(3, 1234.6)), page)).toEqual(seekRequest(3, 1235))
    expect(parseSeekReply(from(seekReply(3, true)), page)).toEqual(seekReply(3, true))
  })

  it("rebuilds a message from its checked fields only", () => {
    const data = { ...seekRequest(1, 10), extra: "<script>" }
    expect(parseSeekRequest(from(data), page)).toEqual(seekRequest(1, 10))
  })

  it("accepts messages only from the netflix.com window itself", () => {
    const data = seekRequest(1, 10)
    expect(parseSeekRequest(from(data, { origin: "https://evil.example" }), page)).toBeNull()
    expect(parseSeekRequest(from(data, { origin: "http://www.netflix.com" }), page)).toBeNull()
    expect(parseSeekRequest(from(data, { source: {} }), page)).toBeNull()
    expect(parseSeekReply(from(seekReply(1, true), { source: null }), page)).toBeNull()
  })

  it("drops anything that is not exactly a seek or its reply", () => {
    const bad: unknown[] = [
      null,
      "seek",
      { ...seekRequest(1, 10), channel: "other" },
      { ...seekRequest(1, 10), kind: "play" },
      { ...seekRequest(1, 10), ms: -1 },
      { ...seekRequest(1, 10), ms: Number.NaN },
      { ...seekRequest(1, 10), ms: "10" },
      { ...seekRequest(1, 10), ms: 1e12 },
      { ...seekRequest(1, 10), id: 1.5 },
    ]
    for (const data of bad) expect(parseSeekRequest(from(data), page)).toBeNull()
    expect(parseSeekReply(from(seekRequest(1, 10)), page)).toBeNull()
    expect(parseSeekRequest(from(seekReply(1, true)), page)).toBeNull()
    expect(parseSeekReply(from({ ...seekReply(1, true), ok: "yes" }), page)).toBeNull()
  })
})
