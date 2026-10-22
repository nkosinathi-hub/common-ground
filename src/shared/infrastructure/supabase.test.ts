import { describe, expect, it, vi } from "vitest"
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

  it("refuses an invalid URL with the same message as the build", () => {
    expect(() => createSupabase("abc.supabase.co", "key")).toThrow(
      /needs a valid VITE_SUPABASE_URL/,
    )
  })

  it("refuses a missing URL or key", () => {
    expect(() => createSupabase("", "key")).toThrow(/not configured/)
  })

  it("keeps the Realtime heartbeat in a worker, so a backgrounded tab stays connected", () => {
    vi.stubGlobal("Worker", class {})
    expect(createSupabase("http://127.0.0.1:54321", "key").realtime.worker).toBe(true)
    vi.unstubAllGlobals()
    expect(createSupabase("http://127.0.0.1:54321", "key").realtime.worker).toBeFalsy()
  })

  it("keeps the heartbeat on the page for the extension, where a worker may be refused", () => {
    vi.stubGlobal("Worker", class {})
    expect(createSupabase("http://127.0.0.1:54321", "key", undefined, false).realtime.worker).toBe(
      false,
    )
    vi.unstubAllGlobals()
  })

  it("creates a client for a bare origin", () => {
    expect(typeof createSupabase("http://127.0.0.1:54321", "key").from).toBe("function")
  })
})
