# Engineering standards

The short version of how work is done here. Details: [conventions](CONVENTIONS.md).

## Tests first

1. Write the failing test for the acceptance criterion: pgTAP for schema, RLS and RPCs; Vitest for
   domain rules, use cases (with in-memory fakes from `testing/`) and components; Playwright for
   flows and accessibility.
2. Make it pass with the smallest change.
3. Refactor until the rules below hold.

Security is proven at the database (pgTAP), not through the UI.

## Size and shape

- No file over 100 lines, including tests, SQL, YAML, scripts and docs. Exempt only: the lockfile,
  generated `database.types.ts`, `supabase/config.toml` and binary assets
  (`scripts/guard/file-length-rule.ts`). Split by concern, not by line count.
- Layers per feature: `domain` <- `application` <- `infrastructure` / `ui`; features import each
  other only through `index.ts`; Supabase only in `infrastructure`
  (`scripts/guard/layers-rule.ts`, `scripts/guard/layers-classify.ts`).
- Errors cross layers as `Result<T, AppError>`.

## Text

- No em dash anywhere (code, docs, commits, UI copy). No emojis; icons come from `@lucide/svelte`.

## Before pushing

- `pnpm guard` must be green: format, dependency audit (high and above), static rules, lint,
  import cycles (madge), copy-paste (jscpd), dead code (knip), type check, unit tests with
  coverage, Edge Function check, database tests, Supabase advisors, build, bundle secret scan.
  `pnpm guard:e2e` adds Playwright for flow changes.
- Lefthook runs format, static rules and lint on every commit.
- Never push to `main`.

## Commits and merge requests

- Single-line conventional commits referencing the issue: `feat: invites, single-use redemption (#7)`.
- No Co-Authored-By trailers.
- Every MR has a backing issue; the title starts with `#<issue>`. Use the Default MR template:
  What, Why, How tested (guard and guard:e2e checkboxes), Decisions, `Closes #`.
- Decisions that outlive the MR become an ADR in `docs/adr/`.
