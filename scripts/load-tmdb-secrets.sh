#!/usr/bin/env bash
# Writes TMDB credentials into supabase/functions/.env (gitignored) for `supabase functions serve`.
# With --remote it also pushes them to the linked Supabase project as function secrets.
# Secret values are never printed: only key names and file paths reach the terminal.
set -euo pipefail

KEYS_FILE="${TMDB_KEYS_FILE:-$HOME/Downloads/tmdb keys}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/supabase/functions/.env"
ORIGINS="http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173"

if [[ ! -r "$KEYS_FILE" ]]; then
  echo "TMDB keys file not found: $KEYS_FILE" >&2
  exit 1
fi

# Value after the first "Label:" on the matching line, whitespace trimmed.
value_of() {
  grep -m1 -E "^[[:space:]]*$1[[:space:]]*:" "$KEYS_FILE" \
    | sed -E "s/^[[:space:]]*$1[[:space:]]*:[[:space:]]*//; s/[[:space:]]+$//" \
    | tr -d '\r' || true
}

token="$(value_of "TMDB Access Token")"
api_key="$(value_of "TMDB")"

if [[ ! "$token" =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
  echo "No TMDB access token (JWT) found in $KEYS_FILE" >&2
  exit 1
fi
if [[ -n "$api_key" && ! "$api_key" =~ ^[0-9a-fA-F]{32}$ ]]; then
  echo "TMDB API key line is not a 32-character key; leaving TMDB_API_KEY empty" >&2
  api_key=""
fi

umask 077
tmp="$(mktemp "$ENV_FILE.XXXXXX")"
{
  printf 'TMDB_ACCESS_TOKEN=%s\n' "$token"
  printf 'TMDB_API_KEY=%s\n' "$api_key"
  printf 'TMDB_BASE_URL=%s\n' "${TMDB_BASE_URL:-https://api.themoviedb.org/3}"
  printf 'ALLOWED_ORIGINS=%s\n' "${ALLOWED_ORIGINS:-$ORIGINS}"
} > "$tmp"
mv "$tmp" "$ENV_FILE"
unset token api_key
echo "Wrote $(cut -d= -f1 "$ENV_FILE" | paste -sd, -) to $ENV_FILE"

if [[ "${1:-}" == "--remote" ]]; then
  (cd "$ROOT" && pnpm exec supabase secrets set --env-file supabase/functions/.env > /dev/null)
  echo "Pushed function secrets to the linked Supabase project"
fi
