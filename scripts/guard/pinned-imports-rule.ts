import { importsOf } from "./layers-classify"

export interface PinViolation {
  readonly path: string
  readonly reason: string
}

export const IMPORT_MAP = "supabase/functions/deno.json"
const FUNCTIONS = /^supabase\/functions\/.+\.ts$/
const REMOTE = /^(npm:|jsr:|https?:)/
const EXACT = /^(npm|jsr):(@[^/@]+\/)?[^@]+@\d+\.\d+\.\d+$/

/** Edge Functions import remote code by bare name only, so one import map decides every version. */
export function checkFunctionImports(path: string, text: string): PinViolation[] {
  if (!FUNCTIONS.test(path)) return []
  return importsOf(text)
    .filter((spec) => REMOTE.test(spec))
    .map((spec) => ({ path, reason: `import "${spec}" through ${IMPORT_MAP}` }))
}

/** Every import map entry names an exact npm or jsr version (deno.lock then pins the content). */
export function checkDenoImportMap(text: string): PinViolation[] {
  const imports = (JSON.parse(text) as { imports?: Record<string, string> }).imports ?? {}
  return Object.entries(imports)
    .filter(([, spec]) => !EXACT.test(spec))
    .map(([name, spec]) => ({
      path: IMPORT_MAP,
      reason: `"${name}" must pin an exact version, found "${spec}"`,
    }))
}
