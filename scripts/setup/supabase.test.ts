import { describe, expect, it } from "vitest"
import { envOverrides, parseArgs, parseStatusEnv, startArgs } from "./supabase"

describe("supabase setup options", () => {
  it("defaults to excluding the heavy local services", () => {
    const options = parseArgs([])
    expect(options).toEqual({ full: false, noFunctions: false, skipStack: false })
    expect(startArgs(options)).toEqual(["start", "-x", "studio,imgproxy,vector,logflare"])
  })

  it("can also drop edge functions, or start everything", () => {
    expect(startArgs(parseArgs(["--no-functions"]))).toEqual([
      "start",
      "-x",
      "studio,imgproxy,vector,logflare,edge-runtime",
    ])
    expect(startArgs(parseArgs(["--full"]))).toEqual(["start"])
    expect(parseArgs(["--skip-stack"]).skipStack).toBe(true)
  })

  it("rejects unknown flags", () => {
    expect(() => parseArgs(["--nope"])).toThrow("unknown flag --nope")
  })

  it("parses `supabase status -o env` output", () => {
    const out = 'API_URL="http://127.0.0.1:54321"\nPUBLISHABLE_KEY="sb_publishable_x"\nnoise\n'
    expect(parseStatusEnv(out)).toEqual({
      API_URL: "http://127.0.0.1:54321",
      PUBLISHABLE_KEY: "sb_publishable_x",
    })
  })

  it("maps local status to the public client variables", () => {
    expect(envOverrides({ API_URL: "u", PUBLISHABLE_KEY: "p", ANON_KEY: "a" })).toEqual({
      VITE_SUPABASE_URL: "u",
      VITE_SUPABASE_ANON_KEY: "p",
    })
    expect(envOverrides({ API_URL: "u", ANON_KEY: "a" }).VITE_SUPABASE_ANON_KEY).toBe("a")
    expect(envOverrides({})).toEqual({})
  })
})
