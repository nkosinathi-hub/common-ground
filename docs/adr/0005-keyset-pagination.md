# 0005. Keyset pagination on (created_at, id), 50 rows per page

- Status: accepted
- Date: 2026-10-15

## Context

The export capped every list at 100 rows. Offset pagination skips or repeats rows when items
are added while someone pages, and gets slower with depth.

## Decision

- Lists page by the keyset `(created_at desc, id desc)` with `PAGE_SIZE = 50`
  (`src/shared/domain/page.ts`). The cursor is the last row's `(createdAt, id)`.
- A full page means there may be more; an empty or short page ends the list.
- Each paged table has a matching index, e.g. `ideas (space_id, created_at desc, id desc)`.

## Consequences

- Stable pages under concurrent inserts and constant cost per page.
- No "jump to page N"; the UI offers "load more".
- Release acceptance seeds 150 rows and pages through all of them.
