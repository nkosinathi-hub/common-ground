# 0007. One branch and one merge request for v0.1

- Status: accepted
- Date: 2026-10-15

## Context

v0.1 is built by one maintainer with agent help, in parallel worktrees, against a release
acceptance matrix that only makes sense as a whole.

## Decision

- Issue #1 is the v0.1 umbrella; work items are issues #2 to #20 on milestone v0.1.
- All work lands on branch `1-v0-1` (feature worktrees branch from it and rebase onto it).
- One MR, `#1 feat: common ground v0.1`, targets `main` and lists `Closes #1` to `Closes #20`
  with a per-issue test plan. It opens only when the acceptance matrix is green.
- Commits stay small, single-line and conventional, each referencing its issue.

## Consequences

- `main` only ever holds a releasable app, so the Pages deploy on `main` is always safe.
- Review is large; the per-issue commits and test plan keep it navigable.
- Parallel branches must share the local stack without changing it (`scripts/db-try.sh`).
