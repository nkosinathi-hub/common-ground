import { describe, expect, it } from "vitest"
import { createSupabase } from "./supabase"

describe("createSupabase", () => {
  it("refuses a URL with a path such as /rest/v1/", () => {
    expect(() => createSupabase("https://abc.supabase.co/rest/v1/", "key")).toThrow(
      /VITE_SUPABASE_URL must be the project origin.*without a path such as \/rest\/v1\//,
    )
  })

  it("refuses a URL with a query or hash", () => {
    expect(() => createSupabase("https://abc.supabase.co/?a=1", "key")).toThrow(/project origin/)
    expect(() => createSupabase("https://abc.supabase.co/#a", "key")).toThrow(/project origin/)
  })

  it("refuses a missing URL or key", () => {
    expect(() => createSupabase("", "key")).toThrow(/not configured/)
  })

  it("creates a client for a bare origin", () => {
    expect(typeof createSupabase("http://127.0.0.1:54321", "key").from).toBe("function")
  })
})
