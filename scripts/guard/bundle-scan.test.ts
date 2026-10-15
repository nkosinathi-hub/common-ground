import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { findSecrets, scanDir } from "./bundle-rules"

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")
const jwt = (payload: object) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.c2lnbmF0dXJl`
const SERVICE = jwt({ iss: "supabase", role: "service_role", exp: 1983812996 })
const ANON = jwt({ iss: "supabase", role: "anon", exp: 1983812996 })
const TMDB = jwt({
  aud: "0123456789abcdef0123456789abcdef",
  sub: "0123456789abcdef01234567",
  scopes: ["api_read"],
  version: 1,
})
const bundle = (key: string) => `const c=createClient("https://x.supabase.co","${key}");`

describe("bundle secret rules", () => {
  it("flags a service-role JWT even though the role is only base64 inside it", () => {
    expect(findSecrets(bundle(SERVICE), [])).not.toEqual([])
  })

  it("flags an sb_secret_ key", () => {
    expect(findSecrets(bundle("sb_secret_abcDEF123_-xyz"), [])).not.toEqual([])
  })

  it("flags a TMDB read access token", () => {
    expect(findSecrets(bundle(TMDB), [])).not.toEqual([])
  })

  it("flags a value copied from the functions env file", () => {
    expect(findSecrets("x=0123456789abcdef9", ["0123456789abcdef9"])).not.toEqual([])
  })

  it("allows the anon JWT and the publishable key", () => {
    expect(findSecrets(bundle(ANON), [])).toEqual([])
    expect(findSecrets(bundle("sb_publishable_abcDEF123_xyz"), [])).toEqual([])
  })

  it("ignores dotted text that is not a JWT", () => {
    expect(findSecrets("a.b.c eyJx.eyJ!.z", [])).toEqual([])
  })
})

describe("bundle scan of a directory", () => {
  it("passes an empty dist", () => {
    expect(scanDir(mkdtempSync(join(tmpdir(), "dist-")), [])).toEqual([])
  })

  it("reports each nested file holding a secret", () => {
    const dir = mkdtempSync(join(tmpdir(), "dist-"))
    mkdirSync(join(dir, "assets"))
    writeFileSync(join(dir, "assets", "app.js"), bundle(SERVICE))
    writeFileSync(join(dir, "index.html"), bundle(ANON))
    expect(scanDir(dir, [])).toEqual([join(dir, "assets", "app.js")])
  })
})
