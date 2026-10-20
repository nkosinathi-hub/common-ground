import { describe, expect, it } from "vitest"
import { checkDenoImportMap, checkFunctionImports } from "./pinned-imports-rule"

const imp = (spec: string) => `import { x } from "${spec}"\n`

describe("pinned imports rule", () => {
  it("routes every remote import in an Edge Function through the import map", () => {
    const path = "supabase/functions/catalog/index.ts"
    for (const remote of [
      "npm:@supabase/supabase-js@2",
      "jsr:@std/assert@1",
      "https://x.dev/y.ts",
    ]) {
      expect(checkFunctionImports(path, imp(remote))).toHaveLength(1)
    }
    expect(checkFunctionImports(path, imp("@supabase/supabase-js"))).toEqual([])
    expect(checkFunctionImports(path, imp("../_shared/http/index.ts"))).toEqual([])
    expect(checkFunctionImports("src/app/App.svelte", imp("npm:x@1"))).toEqual([])
  })

  it("pins every import map entry to an exact version", () => {
    const map = (spec: string) => JSON.stringify({ imports: { lib: spec } })
    expect(checkDenoImportMap(map("npm:@supabase/supabase-js@2"))).toHaveLength(1)
    expect(checkDenoImportMap(map("npm:@supabase/supabase-js@^2.117.3"))).toHaveLength(1)
    expect(checkDenoImportMap(map("jsr:@std/assert@1.0"))).toHaveLength(1)
    expect(checkDenoImportMap(map("https://x.dev/y.ts"))).toHaveLength(1)
    expect(checkDenoImportMap(map("npm:@supabase/supabase-js@2.117.3"))).toEqual([])
    expect(checkDenoImportMap(map("jsr:@std/assert@1.0.13"))).toEqual([])
  })
})
