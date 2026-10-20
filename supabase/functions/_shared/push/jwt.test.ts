// @vitest-environment node
import { describe, expect, it } from "vitest"
import { FCM_SCOPE, signAssertion } from "./jwt.ts"
import { encodeAccount, fromBase64Url, sampleAccount } from "./samples.ts"
import { parseServiceAccount } from "./service-account.ts"

const RS256 = { name: "RSASSA-PKCS1-v1_5" }
const json = (part: string): unknown => JSON.parse(new TextDecoder().decode(fromBase64Url(part)))

describe("parseServiceAccount", () => {
  it("reads Google's key file from base64", async () => {
    const { account } = await sampleAccount()
    expect(parseServiceAccount(encodeAccount(account))).toEqual(account)
  })

  it("reads nothing from a missing, malformed or partial secret", () => {
    expect(parseServiceAccount("")).toBeNull()
    expect(parseServiceAccount("not base64 json")).toBeNull()
    expect(parseServiceAccount(btoa(JSON.stringify({ project_id: "x" })))).toBeNull()
  })

  it("defaults the token endpoint", async () => {
    const { account } = await sampleAccount()
    const raw = JSON.parse(atob(encodeAccount(account))) as Record<string, unknown>
    delete raw.token_uri
    expect(parseServiceAccount(btoa(JSON.stringify(raw)))?.tokenUri).toBe(account.tokenUri)
  })
})

describe("signAssertion", () => {
  it("signs an RS256 assertion for the messaging scope, valid for an hour", async () => {
    const { account, publicKey } = await sampleAccount()
    const jwt = await signAssertion(account, 1_700_000_000)
    const [header, claims, signature] = jwt.split(".") as [string, string, string]
    expect(json(header)).toEqual({ alg: "RS256", typ: "JWT" })
    expect(json(claims)).toEqual({
      iss: account.clientEmail,
      scope: FCM_SCOPE,
      aud: account.tokenUri,
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    })
    const signed = new TextEncoder().encode(`${header}.${claims}`)
    const valid = await crypto.subtle.verify(
      RS256,
      publicKey,
      fromBase64Url(signature).buffer as ArrayBuffer,
      signed,
    )
    expect(valid).toBe(true)
    expect(jwt).not.toMatch(/[+/=]/)
  })
})
