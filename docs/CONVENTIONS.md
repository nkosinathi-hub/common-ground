# Conventions

Rules every change follows. `pnpm guard` enforces the mechanical ones.

## Layout

```
src/app/                    composition root, router, shell
src/shared/domain/          Result, Money, DateOnly, ids, errors (pure)
src/shared/infrastructure/  Supabase client, generated database types
src/shared/ui/              cross-feature Svelte primitives (states, layout)
src/lib/components/ui/      shadcn-svelte generated components
src/features/<name>/
  domain/          pure types and rules; imports shared/domain and own domain only
  application/     use cases; depend on ports.ts interfaces, never on Supabase
  infrastructure/  adapters implementing the ports with Supabase
  ui/              Svelte components and rune stores (*.svelte.ts)
  testing/         in-memory fakes of the ports, used by tests
  index.ts         public surface; other features and src/app import only this
supabase/migrations/        one concern per file, timestamped
supabase/tests/database/<feature>/*.test.sql   pgTAP
supabase/functions/<name>/index.ts             thin Deno entry
supabase/functions/_shared/                    pure TS, unit-tested by Vitest
```

## Layer rules (scripts/guard/layers-rule.ts, scripts/guard/layers-classify.ts)

| From                   | May import                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| shared/domain          | shared/domain                                                                                |
| feature domain         | shared/domain, own domain                                                                    |
| feature application    | shared/domain, own domain, own application, other features' index.ts                         |
| feature infrastructure | shared/domain, shared/infrastructure, own domain, own application                            |
| feature ui             | shared/domain, shared/ui, lib, own domain, own application, own ui, other features' index.ts |
| feature testing        | shared/domain, own domain, own application                                                   |
| app                    | anything                                                                                     |

`@supabase/supabase-js` is imported only from `shared/infrastructure` and feature `infrastructure`.
UI receives use cases through Svelte context set in `src/app/composition/` (one module per area), never by importing an adapter.

## Size and style

- No file over 100 lines (source, tests, SQL, scripts). Split by concern before committing.
- No em dash anywhere. No emojis in UI; icons come from `@lucide/svelte`.
- Errors cross layers as `Result<T, AppError>`; UI maps `AppError.kind` to copy.
- Money is integer minor units (`Money`), dates without time are `DateOnly` strings `YYYY-MM-DD`.

## Database

- Migration file names: `YYYYMMDDHHMMSS_<concern>.sql`. Reserved ranges for the v0.1 build:
  `20261015000000-20261015099999` core, `20261015100000-20261015199999` watch,
  `20261015200000-20261015299999` ideas, `20261015300000-20261015399999` collaboration.
- Every table: RLS enabled, deny by default, policies use `public.is_space_member(space_id)` /
  `public.is_space_owner(space_id)`; never read JWT claims for membership.
- Child rows carry `space_id`; cross-space parents are prevented with composite foreign keys
  `(space_id, parent_id) references parent (space_id, id)`.
- Authors: `created_by uuid references public.profiles (id) on delete set null default auth.uid()`.
- Notifications and activity only via `public.notify(...)` and `public.record_activity(...)`
  inside security-definer functions or triggers.
- Security-definer functions: `set search_path = ''`, check `auth.uid()`, explicit grants.

## Tests first

1. Write the failing pgTAP / Vitest / Playwright test for the acceptance criterion.
2. Make it pass with the smallest change.
3. Refactor to the line limit. Run `pnpm guard`.

## Commits

Single-line conventional commits referencing the issue: `feat: invites, single-use redemption (#7)`.
No Co-Authored-By trailers. All v0.1 work lands in branch `1-v0-1` and one MR.
