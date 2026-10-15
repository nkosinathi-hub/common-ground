import { describe, expect, it } from "vitest"
import { checkPurity } from "./purity-rule"

const imp = (spec: string) => `import { x } from "${spec}"\n`

describe("purity rule", () => {
  it("keeps domain and shared/domain free of packages, except vitest in tests", () => {
    expect(checkPurity("src/features/watch/domain/pick.ts", imp("lodash"))).toHaveLength(1)
    expect(checkPurity("src/shared/domain/money.ts", imp("svelte"))).toHaveLength(1)
    expect(checkPurity("src/features/watch/domain/pick.test.ts", imp("vitest"))).toEqual([])
    expect(checkPurity("src/features/watch/domain/pick.ts", imp("./filters"))).toEqual([])
  })

  it("keeps Edge Function shared code portable between Deno and Vitest", () => {
    const path = "supabase/functions/_shared/catalog/map.ts"
    for (const bad of [
      "npm:@supabase/supabase-js@2",
      "jsr:@std/assert",
      "node:fs",
      "https://deno.land/x/y.ts",
    ]) {
      expect(checkPurity(path, imp(bad))).toHaveLength(1)
    }
    expect(checkPurity(path, "const x = Deno.env.get('A')\n")).toHaveLength(1)
    expect(checkPurity(path, imp("./types.ts"))).toEqual([])
  })

  it("forbids the app from talking to Supabase directly", () => {
    expect(checkPurity("src/app/App.svelte", imp("@supabase/supabase-js"))).toHaveLength(1)
    expect(
      checkPurity("src/shared/infrastructure/supabase.ts", imp("@supabase/supabase-js")),
    ).toEqual([])
  })
})
