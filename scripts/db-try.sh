#!/usr/bin/env bash
# Runs unmerged migrations plus pgTAP files inside one transaction per test file, then rolls back.
# Lets parallel branches test against the shared local stack without changing it.
# Usage: scripts/db-try.sh <migration.sql>... -- <test.sql>...
set -euo pipefail
container="${DB_CONTAINER:-supabase_db_common-ground}"
migrations=()
while [[ $# -gt 0 && "$1" != "--" ]]; do migrations+=("$1"); shift; done
shift || true
status=0
for test in "$@"; do
  output=$({
    echo "begin; create extension if not exists pgtap with schema extensions; set local search_path = public, extensions;"
    for m in "${migrations[@]}"; do cat "$m"; echo; done
    grep -v -E '^\s*(begin|rollback);\s*$' "$test"
    echo "rollback;"
  } | podman exec -i "$container" psql -U postgres -q -v ON_ERROR_STOP=1 -X -t 2>&1) || status=1
  if grep -q -E '^\s*not ok|ERROR|Looks like you failed' <<<"$output"; then status=1; fi
  echo "== $test"
  grep -E '^\s*(ok|not ok)|ERROR|#' <<<"$output" || true
done
exit $status
