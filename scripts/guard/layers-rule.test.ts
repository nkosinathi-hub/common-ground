import { describe, expect, it } from "vitest"
import { checkFile } from "./layers-rule"

const imp = (spec: string) => `import { x } from "${spec}"\n`

describe("layer rule", () => {
  it("keeps domain pure", () => {
    const path = "src/features/watch/domain/title.ts"
    expect(checkFile(path, imp("@/shared/domain"))).toEqual([])
    expect(checkFile(path, imp("./intent"))).toEqual([])
    expect(checkFile(path, imp("../infrastructure/repo"))).toHaveLength(1)
    expect(checkFile(path, imp("@/features/ideas/domain/idea"))).toHaveLength(1)
  })

  it("lets application use other features only through index.ts", () => {
    const path = "src/features/watch/application/add-title.ts"
    expect(checkFile(path, imp("@/features/spaces"))).toEqual([])
    expect(checkFile(path, imp("@/features/spaces/domain/space"))).toHaveLength(1)
  })

  it("forbids ui from importing adapters or supabase", () => {
    const path = "src/features/ideas/ui/IdeaBoard.svelte"
    expect(checkFile(path, imp("../infrastructure/supabase-ideas"))).toHaveLength(1)
    expect(checkFile(path, imp("@supabase/supabase-js"))).toHaveLength(1)
    expect(checkFile(path, imp("$lib/components/ui/button"))).toEqual([])
  })

  it("allows supabase in infrastructure and fakes in tests", () => {
    expect(
      checkFile("src/features/ideas/infrastructure/r.ts", imp("@supabase/supabase-js")),
    ).toEqual([])
    expect(checkFile("src/features/ideas/application/a.test.ts", imp("../testing/fake"))).toEqual(
      [],
    )
    expect(checkFile("src/features/ideas/application/a.ts", imp("../testing/fake"))).toHaveLength(1)
  })

  it("ignores packages and the composition root", () => {
    expect(checkFile("src/features/ideas/domain/x.ts", imp("svelte"))).toEqual([])
    expect(checkFile("src/app/composition.ts", imp("@/features/ideas/infrastructure/r"))).toEqual(
      [],
    )
  })
})
