import { importsOf } from "./layers-classify"

export interface PurityViolation {
  readonly path: string
  readonly reason: string
}

const PURE = /^src\/(shared\/domain|features\/[^/]+\/domain)\//
const PORTABLE = /^supabase\/functions\/_shared\//
const APP = /^src\/app\//
const TEST = /\.test\.ts$/

const isPackage = (spec: string) => !spec.startsWith(".") && !spec.startsWith("@/")
const allowedInTest = (path: string, spec: string) => TEST.test(path) && spec === "vitest"

/** Domain code imports no packages; _shared runs under Deno and Vitest alike; app never imports Supabase. */
export function checkPurity(path: string, text: string): PurityViolation[] {
  const imports = importsOf(text)
  const found: PurityViolation[] = []
  if (PURE.test(path)) {
    for (const spec of imports.filter((s) => isPackage(s) && !allowedInTest(path, s))) {
      found.push({ path, reason: `domain must not import "${spec}"` })
    }
  }
  if (PORTABLE.test(path)) {
    for (const spec of imports.filter((s) => isPackage(s) && !allowedInTest(path, s))) {
      found.push({ path, reason: `_shared must stay portable, found "${spec}"` })
    }
    if (/\bDeno\./.test(text)) found.push({ path, reason: "_shared must not use Deno globals" })
  }
  if (APP.test(path)) {
    for (const spec of imports.filter((s) => s.startsWith("@supabase/"))) {
      found.push({ path, reason: `app must go through shared/infrastructure, found "${spec}"` })
    }
  }
  return found
}
