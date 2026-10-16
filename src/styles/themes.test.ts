import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { contrastRatio, type ColourMode } from "@/features/spaces/domain/contrast"
import { SPACE_PRESETS } from "@/features/spaces/domain/look"

const read = (name: string) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), "utf8")
type Vars = Record<string, string>

/** Every `selector { --name: value }` block, keyed by its selector list as written. */
function blocks(css: string): Map<string, Vars> {
  const found = new Map<string, Vars>()
  for (const [, selector, body] of css
    .replaceAll(/\/\*[^]*?\*\//g, "")
    .matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const vars = Object.fromEntries(
      [...body!.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
        name!,
        value!.trim(),
      ]),
    )
    found.set(selector!.trim().replaceAll(/\s+/g, " "), vars)
  }
  return found
}

const tokens = blocks(read("./tokens.css"))
const themes = blocks(read("./themes-light.css") + read("./themes-dark.css"))
const base: Record<ColourMode, Vars> = { light: tokens.get(":root")!, dark: tokens.get(".dark")! }

function presetVars(preset: string, mode: ColourMode): Vars | undefined {
  const light = `[data-space-theme="${preset}"]`
  const dark = `.dark${light}, .dark ${light}`
  return themes.get(mode === "light" ? light : dark)
}

describe("space theme presets", () => {
  for (const preset of SPACE_PRESETS) {
    for (const mode of ["light", "dark"] as const) {
      it(`${preset} in ${mode} mode keeps text readable`, () => {
        const own = presetVars(preset, mode)
        expect(own, `missing ${mode} block for ${preset}`).toBeDefined()
        const v = { ...base.light, ...(mode === "dark" ? base.dark : {}), ...own }
        const pairs: [string, string][] = [
          ["--primary", "--background"],
          ["--primary", "--card"],
          ["--primary", "--banner"],
          ["--primary-foreground", "--primary"],
          ["--foreground", "--accent"],
          ["--foreground", "--sidebar"],
          ["--foreground", "--sidebar-accent"],
          ["--foreground", "--banner"],
          ["--foreground", "--highlight"],
          ["--clay", "--background"],
        ]
        for (const [text, surface] of pairs)
          expect(
            contrastRatio(v[text]!, v[surface]!),
            `${text} on ${surface}`,
          ).toBeGreaterThanOrEqual(4.5)
      })
    }
  }

  it("sets every accent token in each block, so no light value survives in dark mode", () => {
    const names = ["--primary", "--ring", "--accent", "--sidebar", "--sidebar-accent", "--banner"]
    for (const preset of SPACE_PRESETS)
      for (const mode of ["light", "dark"] as const)
        expect(Object.keys(presetVars(preset, mode) ?? {})).toEqual(
          expect.arrayContaining([...names, "--highlight", "--clay"]),
        )
  })
})
