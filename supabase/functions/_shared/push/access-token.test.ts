// @vitest-environment node
import { describe, expect, it, vi } from "vitest"
import { createTokenSource } from "./access-token.ts"
import { sampleAccount } from "./samples.ts"

const grant = (token: string, expiresIn = 3600) =>
  new Response(JSON.stringify({ access_token: token, expires_in: expiresIn, token_type: "Bearer" }))

async function setup(responses: Response[]) {
  const { account } = await sampleAccount()
  let clock = 1_700_000_000_000
  const fetchFn = vi.fn(async (_url: string, _init: RequestInit) => responses.shift()!)
  const source = createTokenSource(account, fetchFn, () => clock)
  return { account, fetchFn, source, advance: (ms: number) => (clock += ms) }
}

describe("createTokenSource", () => {
  it("exchanges a signed assertion for an access token at the key file's endpoint", async () => {
    const { account, fetchFn, source } = await setup([grant("ya29.first")])
    expect(await source()).toBe("ya29.first")
    const [url, init] = fetchFn.mock.calls[0]!
    expect(url).toBe(account.tokenUri)
    const form = new URLSearchParams(init.body as string)
    expect(form.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer")
    expect(form.get("assertion")?.split(".")).toHaveLength(3)
  })

  it("reuses the token until a minute before it expires", async () => {
    const { fetchFn, source, advance } = await setup([grant("ya29.first"), grant("ya29.second")])
    await source()
    advance(3_500_000)
    expect(await source()).toBe("ya29.first")
    advance(60_000)
    expect(await source()).toBe("ya29.second")
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it("fails without detail when Google refuses or answers oddly", async () => {
    const refused = await setup([new Response("{}", { status: 400 })])
    await expect(refused.source()).rejects.toThrow("access token request failed")
    const odd = await setup([new Response(JSON.stringify({ expires_in: 10 }))])
    await expect(odd.source()).rejects.toThrow("access token request failed")
  })
})
