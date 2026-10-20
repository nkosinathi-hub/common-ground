#!/usr/bin/env bash
# Puts TMDB credentials into supabase/functions/.env (gitignored) for `supabase functions serve`,
# keeping every other key in that file (and adding the local-only defaults below). With --remote it pushes ONLY the TMDB keys to the linked
# project, so production ALLOWED_ORIGINS and CLEANUP_SECRET are never overwritten.
# Secret values are never printed: only key names reach the terminal.
set -euo pipefail

KEYS_FILE="${TMDB_KEYS_FILE:-$HOME/Downloads/tmdb keys}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/supabase/functions/.env"
LOCAL_ORIGINS="http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173"
LOCAL_API="http://127.0.0.1:54321"

[[ -r "$KEYS_FILE" ]] || { echo "TMDB keys file not found: $KEYS_FILE (set TMDB_KEYS_FILE)" >&2; exit 1; }

# Value after "<label>:" on the first line that starts with the label. Fixed-string match.
value_of() {
  awk -v label="$1" '{ line = $0; sub(/^[ \t]+/, "", line) }
    index(line, label ":") == 1 { v = substr(line, length(label) + 2); gsub(/^[ \t]+|[ \t\r]+$/, "", v); print v; exit }' "$KEYS_FILE"
}

token="$(value_of "TMDB Access Token")"
api_key="$(value_of "TMDB")"
[[ "$token" =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]] || { echo "No TMDB access token in $KEYS_FILE" >&2; exit 1; }
[[ -z "$api_key" || "$api_key" =~ ^[0-9a-fA-F]{32}$ ]] || { echo "Ignoring malformed TMDB API key" >&2; api_key=""; }

umask 077
tmp="$(mktemp "$ENV_FILE.XXXXXX")"
trap 'rm -f "$tmp" "${remote_tmp:-}"' EXIT

# Keep existing keys except the ones this script owns; add local origins only if none are set.
{
  [[ -f "$ENV_FILE" ]] && grep -v -E '^(TMDB_ACCESS_TOKEN|TMDB_API_KEY|TMDB_BASE_URL)=' "$ENV_FILE" || true
  printf 'TMDB_ACCESS_TOKEN=%s\nTMDB_API_KEY=%s\nTMDB_BASE_URL=%s\n' \
    "$token" "$api_key" "${TMDB_BASE_URL:-https://api.themoviedb.org/3}"
  [[ -f "$ENV_FILE" ]] && grep -q '^ALLOWED_ORIGINS=' "$ENV_FILE" || printf 'ALLOWED_ORIGINS=%s\n' "$LOCAL_ORIGINS"
  # Locally, signed Storage URLs name the internal gateway; hand the browser this origin instead.
  [[ -f "$ENV_FILE" ]] && grep -q '^PUBLIC_API_URL=' "$ENV_FILE" || printf 'PUBLIC_API_URL=%s\n' "$LOCAL_API"
} > "$tmp"
mv "$tmp" "$ENV_FILE"
echo "Wrote $(cut -d= -f1 "$ENV_FILE" | paste -sd, -) to $ENV_FILE"

if [[ "${1:-}" == "--remote" ]]; then
  remote_tmp="$(mktemp)"
  grep -E '^(TMDB_ACCESS_TOKEN|TMDB_API_KEY|TMDB_BASE_URL)=' "$ENV_FILE" > "$remote_tmp"
  (cd "$ROOT" && pnpm exec supabase secrets set --env-file "$remote_tmp" > /dev/null)
  echo "Pushed TMDB_ACCESS_TOKEN, TMDB_API_KEY, TMDB_BASE_URL to the linked Supabase project"
fi
unset token api_key
