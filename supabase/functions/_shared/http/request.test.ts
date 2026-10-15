import { describe, expect, it } from "vitest"
import { bearerToken, isUuid, readJson } from "./request.ts"

const post = (body: string) => new Request("http://fn.test", { method: "POST", body })

describe("bearerToken", () => {
  it("extracts the token from an Authorization header", () => {
    expect(bearerToken("Bearer abc.def")).toBe("abc.def")
    expect(bearerToken("bearer abc")).toBe("abc")
    expect(bearerToken("Basic abc")).toBeNull()
    expect(bearerToken(null)).toBeNull()
  })
})

describe("readJson", () => {
  it("parses a JSON body and reads a malformed one as null", async () => {
    expect(await readJson(post('{"action":"cleanup"}'))).toEqual({ action: "cleanup" })
    expect(await readJson(post("{not json"))).toBeNull()
  })
})

describe("isUuid", () => {
  it("accepts only uuid strings", () => {
    expect(isUuid("0B9C2F6E-6A43-4C8E-9F0A-3D2B1C4E5F60")).toBe(true)
    expect(isUuid("../0b9c2f6e")).toBe(false)
    expect(isUuid(42)).toBe(false)
  })
})
