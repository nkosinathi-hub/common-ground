export interface SetupOptions {
  /** Start every service, including Studio and logging. */
  readonly full: boolean
  /** Also skip the Edge Functions runtime (the catalog then answers with errors). */
  readonly noFunctions: boolean
  /** Only check tools and .env; leave the Supabase stack alone. */
  readonly skipStack: boolean
}

const FLAGS: Record<string, keyof SetupOptions> = {
  "--full": "full",
  "--no-functions": "noFunctions",
  "--skip-stack": "skipStack",
}

export function parseArgs(argv: readonly string[]): SetupOptions {
  const options = { full: false, noFunctions: false, skipStack: false }
  for (const arg of argv) {
    const key = FLAGS[arg]
    if (!key) throw new Error(`unknown flag ${arg} (known: ${Object.keys(FLAGS).join(", ")})`)
    options[key] = true
  }
  return options
}

/** Services the local stack does not need day to day; they cost memory and disk. */
export const HEAVY = ["studio", "imgproxy", "vector", "logflare"]

export function startArgs(options: SetupOptions): string[] {
  if (options.full) return ["start"]
  const excluded = options.noFunctions ? [...HEAVY, "edge-runtime"] : HEAVY
  return ["start", "-x", excluded.join(",")]
}

/** Parses `supabase status -o env` (KEY="value" lines). */
export function parseStatusEnv(out: string): Record<string, string> {
  return Object.fromEntries(
    out.split("\n").flatMap((line) => {
      const match = /^([A-Z_]+)="?([^"]*)"?$/.exec(line.trim())
      return match ? [[match[1]!, match[2]!]] : []
    }),
  )
}

/** Public client values for .env, taken from the running local stack. */
export function envOverrides(status: Record<string, string>): Record<string, string> {
  const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY
  return {
    ...(status.API_URL ? { VITE_SUPABASE_URL: status.API_URL } : {}),
    ...(key ? { VITE_SUPABASE_ANON_KEY: key } : {}),
  }
}
