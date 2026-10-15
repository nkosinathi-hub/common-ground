import { classify, importsOf, resolveImport, type Location, type Zone } from "./layers-classify"

type Allow = (from: Location, to: Location) => boolean

const same = (from: Location, to: Location) => from.feature === to.feature
const own = (...zones: Zone[]): Allow => (f, t) => same(f, t) && zones.includes(t.zone)
const any = (...zones: Zone[]): Allow => (_f, t) => zones.includes(t.zone)
const otherApi: Allow = (f, t) => t.zone === "feature-api" && !same(f, t)

const RULES: Partial<Record<Zone, Allow[]>> = {
  "shared-domain": [any("shared-domain")],
  "shared-infrastructure": [any("shared-domain", "shared-infrastructure")],
  "shared-ui": [any("shared-domain", "shared-ui", "lib")],
  lib: [any("lib")],
  domain: [any("shared-domain"), own("domain")],
  application: [any("shared-domain"), own("domain", "application"), otherApi],
  infrastructure: [any("shared-domain", "shared-infrastructure"), own("domain", "application", "infrastructure")],
  ui: [any("shared-domain", "shared-ui", "lib"), own("domain", "application", "ui"), otherApi],
  testing: [any("shared-domain"), own("domain", "application", "testing")],
}

const SUPABASE_ZONES: Zone[] = ["shared-infrastructure", "infrastructure", "app"]

export interface LayerViolation {
  readonly path: string
  readonly specifier: string
}

export function checkFile(path: string, text: string): LayerViolation[] {
  const from = classify(path)
  if (from.zone === "app" || from.zone === "other" || from.zone === "feature-api") return []
  const isTest = /\.test\.ts$/.test(path)
  return importsOf(text).flatMap((specifier) => {
    if (specifier.startsWith("@supabase/")) {
      return SUPABASE_ZONES.includes(from.zone) ? [] : [{ path, specifier }]
    }
    const target = resolveImport(path, specifier)
    if (target === null) return []
    const to = classify(target)
    if (to.zone === "other") return []
    if (isTest && to.zone === "testing" && same(from, to)) return []
    const allowed = (RULES[from.zone] ?? []).some((rule) => rule(from, to))
    return allowed ? [] : [{ path, specifier }]
  })
}
