import { describe, expect, it } from "vitest"
import type { SecurityPolicy } from "./plugin.types"
import { cspOrigins } from "./csp-origins"
import { EMPTY_POLICY } from "./policy"

const plugin = (type: string, security: Partial<SecurityPolicy>) => ({
  type,
  security: { ...EMPTY_POLICY, ...security },
})

describe("cspOrigins", () => {
  it("collects each directive's origins once; media and subtitles also go to connect", () => {
    const origins = cspOrigins([
      plugin("a", { connect: ["https://api.a.org"], media: ["https://cdn.a.org"] }),
      plugin("b", {
        media: ["https://cdn.a.org"],
        frames: ["https://www.youtube-nocookie.com"],
        subtitles: ["https://subs.b.org"],
      }),
    ])
    expect(origins).toEqual({
      connect: ["https://api.a.org", "https://cdn.a.org", "https://subs.b.org"],
      media: ["https://cdn.a.org", "https://subs.b.org"],
      frames: ["https://www.youtube-nocookie.com"],
    })
  })

  it("fails the build on a plugin that declares a bad origin", () => {
    expect(() => cspOrigins([plugin("bad", { media: ["*"] })])).toThrow(/bad.*media/)
    expect(() => cspOrigins([plugin("bad", { frames: ["http://a.org"] })])).toThrow(/https/)
    expect(() => cspOrigins([plugin("bad", { connect: ["javascript:x"] })])).toThrow(/script/)
  })

  it("is empty with no plugins", () => {
    expect(cspOrigins([])).toEqual({ connect: [], media: [], frames: [] })
  })
})
