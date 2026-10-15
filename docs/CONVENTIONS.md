# Conventions

Rules every change follows. `pnpm guard` enforces the mechanical ones.

## Layout

```
src/app/                    router (routing/), shell (shell/), pages (pages/)
src/app/composition/        the only place adapters are built and provided as context:
  index.ts                  compose() and provideServices(), wires the modules below
  core.ts                   auth, account, spaces, catalog, notifications
  members.ts                space membership as the shared MemberDirectory
  watch.ts                  watch
  ideas.ts                  ideas, research, tasks, budget
  collaboration.ts          comments, recommendations, attachments
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
supabase/functions/<name>/index.ts             thin Deno entry (Deno adapters beside it)
supabase/functions/_shared/                    pure TS, unit-tested by Vitest
supabase/functions/_deno/                      Deno-only adapters shared by the entries
                                               (npm:@supabase/supabase-js); not deployed
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

- Migration file names: `YYYYMMDDHHMMSS_<concern>.sql`. Ranges used by the v0.1 build (all on
  `20261015`, so only the time part is shown; files sort and apply in this order):

  | Range           | Concern                                                                  |
  | --------------- | ------------------------------------------------------------------------ |
  | `000100-001299` | foundation: profiles, spaces, membership, notifications, invites         |
  | `001300-001999` | spaces and invites fixes (`001300` delete reauth, `001500` polish)       |
  | `100000-149999` | watch: items, progress, sessions, list                                   |
  | `150000-159999` | catalog: cache, rate limits                                              |
  | `200000-209999` | ideas: briefs, research, milestones, tasks, budget, rules, activity      |
  | `300000-349999` | comments and recommendations                                             |
  | `350000-359999` | attachments: table, storage, RPCs, column grants (`350100-350400`)       |
  | `400000-409999` | account: export and delete (`450000-459999` for account follow-ups)      |
  | `990000`        | function grants; runs last, revokes PUBLIC/anon EXECUTE on all functions |

  Pick the next free slot in your concern's range; never reuse or renumber an applied file.

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
