# 0003. Row-level security for all data access; security-definer RPCs for multi-row changes

- Status: accepted
- Date: 2026-10-15

## Context

The browser talks to Postgres directly through PostgREST with the publishable key. Anything the
client can call, an attacker with a valid account can call too.

## Decision

- Every table enables RLS and denies by default. Policies use `public.is_space_member(space_id)`
  and `public.is_space_owner(space_id)`, never JWT claims, so removal takes effect immediately.
- Grants are explicit and column-level where only some columns may change.
- Child rows carry `space_id`; composite foreign keys `(space_id, parent_id)` stop a row from
  pointing into another space.
- Operations touching several rows or enforcing invariants (create space with owner, leave,
  remove, transfer ownership, delete with confirmation, invites) are `security definer`
  functions with `set search_path = ''`, an `auth.uid()` check and explicit execute grants.
- Notifications and activity are written only by `public.notify` and `public.record_activity`
  inside those functions or triggers, in the same transaction.
- Service-only tables (`catalog_cache`, `rate_limits`) have no client grants at all.

## Consequences

- Security is proven by pgTAP (`supabase/tests/database`), not by UI tests: a third user and a
  removed member read and write nothing, even with guessed UUIDs.
- The UI can stay thin; it maps `AppError.kind` to copy.
