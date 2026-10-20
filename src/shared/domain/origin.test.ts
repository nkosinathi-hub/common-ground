import { describe, expect, it } from "vitest"
import { bareOrigin } from "./origin"

describe("bareOrigin", () => {
  const message =
    /VITE_SUPABASE_URL must be the project origin.*without a path such as \/rest\/v1\//

  it.each([
    "https://abc.supabase.co/rest/v1/",
    "https://abc.supabase.co/rest/v1",
    "https://abc.supabase.co/?x=1",
    "https://abc.supabase.co/#top",
    "ftp://abc.supabase.co",
  ])("rejects %s", (url) => {
    expect(() => bareOrigin(url)).toThrow(message)
  })

  it("rejects a missing or invalid URL", () => {
    expect(() => bareOrigin("")).toThrow(/needs a valid VITE_SUPABASE_URL/)
    expect(() => bareOrigin("abc.supabase.co")).toThrow(/needs a valid VITE_SUPABASE_URL/)
  })

  it.each(["https://abc.supabase.co", "https://abc.supabase.co/", "http://127.0.0.1:54321"])(
    "accepts %s",
    (url) => {
      expect(bareOrigin(url).origin).toBe(url.replace(/\/$/, ""))
    },
  )
})
