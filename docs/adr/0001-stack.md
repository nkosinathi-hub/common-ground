# 0001. Svelte 5 SPA on Supabase; the Figma export is reference only

- Status: accepted
- Date: 2026-10-15

## Context

Figma Make produced a sound written plan (Svelte, Supabase, GitHub Pages) but generated Next.js 16
and Payload 4 beta code that only runs inside Figma Make: no database adapter, platform storage,
a 1760-line component, no tests and open template collections writable by any user.

## Decision

- Svelte 5 + Vite single-page app, TypeScript strict, Tailwind 4, shadcn-svelte components,
  icons from `@lucide/svelte`.
- Supabase for Postgres (row-level security), Auth, Storage, Edge Functions and Realtime.
- Title data from TMDB; streaming availability from JustWatch via TMDB.
- The Figma export is a UX, copy and design-token reference. No code is copied from it.
- Toolchain pinned in `.mise.toml` (node 24, pnpm 10); the Supabase CLI is a dev dependency.

## Consequences

- No server of our own: everything privileged runs in Postgres (RLS, RPCs) or Edge Functions.
- The app must be fully static, which drives routing and hosting (ADR 0002).
- Export bugs (hidden archived items, members unable to rejoin, CSV tags, text dates) are
  re-specified as tests rather than inherited.
