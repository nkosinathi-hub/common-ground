/**
 * Copy-paste gate (jscpd, pinned). Applied migrations are history and redefine functions by
 * design (docs/migrations.md); shadcn components are vendored; database.types.ts is generated.
 * The limit is the level after #40's extractions: what remains is pgTAP fixture preambles and
 * the import blocks of tests split by the 100-line rule. Lower it when clones go; never raise it.
 */
export const DUPLICATION = {
  paths: ["src", "scripts", "tests", "supabase"],
  ignore: ["supabase/migrations/**", "src/lib/components/ui/**", "**/database.types.ts"],
  maxPercent: 0.21,
} as const

interface Place {
  readonly name: string
  readonly start: number
}

export interface DuplicationReport {
  readonly statistics: { readonly total: { readonly percentage: number } }
  readonly duplicates: readonly {
    readonly lines: number
    readonly firstFile: Place
    readonly secondFile: Place
  }[]
}

/** Above the limit: one line for the total, then every clone. */
export function checkDuplication(report: DuplicationReport): string[] {
  const { percentage } = report.statistics.total
  if (percentage <= DUPLICATION.maxPercent) return []
  return [
    `duplicated lines ${percentage}% are above the ${DUPLICATION.maxPercent}% limit; clones:`,
    ...report.duplicates.map(
      (c) =>
        `${c.firstFile.name}:${c.firstFile.start} and ${c.secondFile.name}:${c.secondFile.start} (${c.lines} lines)`,
    ),
  ]
}
