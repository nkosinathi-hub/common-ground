import { describe, expect, it } from "vitest"
import type { SecurityPolicy } from "./plugin.types"
import { EMPTY_POLICY, validatePolicy } from "./policy"

const policy = (extra: Partial<SecurityPolicy>): SecurityPolicy => ({ ...EMPTY_POLICY, ...extra })

describe("validatePolicy", () => {
  it("accepts https origins in every directive and the allowed sandbox tokens", () => {
    const good = policy({
      connect: ["https://archive.org"],
      media: ["https://*.us.archive.org"],
      frames: ["https://www.youtube-nocookie.com"],
      subtitles: ["https://archive.org"],
      sandbox: ["allow-scripts", "allow-same-origin", "allow-presentation", "allow-popups"],
    })
    expect(validatePolicy(good)).toEqual({ ok: true, value: good })
  })

  it("names the directive and the bad origin", () => {
    const result = validatePolicy(policy({ media: ["https://a.org", "*"] }))
    expect(result).toMatchObject({ ok: false, error: { kind: "validation", field: "media" } })
    if (!result.ok) expect(result.error.message).toContain('"*"')
    expect(validatePolicy(policy({ frames: ["http://a.org"] }))).toMatchObject({
      ok: false,
      error: { field: "frames" },
    })
  })

  it("refuses top navigation and any unknown sandbox token", () => {
    const top = policy({ sandbox: ["allow-top-navigation" as never] })
    expect(validatePolicy(top)).toMatchObject({ ok: false, error: { field: "sandbox" } })
    const escape = policy({ sandbox: ["allow-popups-to-escape-sandbox" as never] })
    expect(validatePolicy(escape)).toMatchObject({ ok: false, error: { field: "sandbox" } })
  })

  it("refuses a policy that is not an object of lists", () => {
    expect(validatePolicy(null as never).ok).toBe(false)
    expect(validatePolicy({ ...EMPTY_POLICY, connect: "https://a.org" } as never).ok).toBe(false)
  })

  it("passes loopback rules through to each origin", () => {
    const local = policy({ media: ["http://127.0.0.1:4100"] })
    expect(validatePolicy(local).ok).toBe(false)
    expect(validatePolicy(local, { allowLoopback: true }).ok).toBe(true)
  })
})
