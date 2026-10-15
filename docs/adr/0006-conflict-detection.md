# 0006. Optimistic conflict detection on updated_at with a merge prompt

- Status: accepted
- Date: 2026-10-15

## Context

Two members can edit the same idea overview or budget at once. Last write wins would silently
discard one person's work.

## Decision

- Editable records carry `updated_at`, maintained by the `set_updated_at` trigger.
- Saves go through RPCs that take the `updated_at` the client loaded as a precondition and
  update only when it still matches; otherwise they raise SQLSTATE `40001`, which the adapter
  maps to a conflict error (e.g. `expected_updated_at` in the idea overview RPC).
- On conflict the UI shows a merge prompt: the other person's version beside the unsaved one,
  with "keep mine", "take theirs" or edit.

## Consequences

- No locks and no lost updates; conflicts are rare and visible.
- Every editable surface needs a conflict test: pgTAP for the precondition, Playwright with two
  browser contexts for the prompt.
