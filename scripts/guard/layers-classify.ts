import { posix } from "node:path"

export type Zone =
  | "app"
  | "shared-domain"
  | "shared-infrastructure"
  | "shared-ui"
  | "lib"
  | "domain"
  | "application"
  | "infrastructure"
  | "ui"
  | "testing"
  | "feature-api"
  | "other"

export interface Location {
  readonly zone: Zone
  readonly feature?: string
}

const LAYERS = new Set(["domain", "application", "infrastructure", "ui", "testing"])

export function classify(path: string): Location {
  const parts = path.replace(/\.(ts|svelte|js)$/, "").split("/")
  if (parts[0] !== "src") return { zone: "other" }
  if (parts[1] === "app") return { zone: "app" }
  if (parts[1] === "lib") return { zone: "lib" }
  if (parts[1] === "shared") {
    const sub = parts[2]
    if (sub === "domain" || sub === "infrastructure" || sub === "ui") return { zone: `shared-${sub}` }
    return { zone: "other" }
  }
  if (parts[1] === "features" && parts[2]) {
    const feature = parts[2]
    if (parts.length === 4 && parts[3] === "index") return { zone: "feature-api", feature }
    const layer = parts[3] ?? ""
    if (LAYERS.has(layer)) return { zone: layer as Zone, feature }
  }
  return { zone: "other" }
}

export function resolveImport(fromPath: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return `src/${specifier.slice(2)}`
  if (specifier === "$lib" || specifier.startsWith("$lib/")) return `src/lib${specifier.slice(4)}`
  if (specifier.startsWith(".")) return posix.normalize(posix.join(posix.dirname(fromPath), specifier))
  return null
}

const IMPORT = /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']|import\s*\(?\s*["']([^"']+)["']/g

export function importsOf(text: string): string[] {
  return [...text.matchAll(IMPORT)].map((m) => m[1] ?? m[2] ?? "").filter(Boolean)
}
