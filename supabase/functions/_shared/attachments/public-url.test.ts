import { describe, expect, it } from "vitest"
import { toPublicUrl } from "./public-url.ts"

const signed = "http://kong:8000/storage/v1/object/upload/sign/attachments/s1/a.png?token=t"

describe("toPublicUrl", () => {
  it("serves a signed URL from the origin the browser can reach", () => {
    expect(toPublicUrl(signed, "http://127.0.0.1:54321")).toBe(
      "http://127.0.0.1:54321/storage/v1/object/upload/sign/attachments/s1/a.png?token=t",
    )
  })

  it("leaves the URL alone when no public origin is configured (hosted projects)", () => {
    expect(toPublicUrl(signed, "")).toBe(signed)
  })
})
