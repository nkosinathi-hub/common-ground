#!/usr/bin/env bash
# Runs CinePro Core for Common Ground (cinepro/compose.yml) in rootless podman or Docker, then
# publishes it over HTTPS with Tailscale on port 8443, beside Jellyfin on 443
# (docs/runbooks/cinepro.md). Usage:
#   scripts/cinepro/server.sh start [serve|funnel]
#   scripts/cinepro/server.sh stop
# `serve` reaches devices on your tailnet only. `funnel` would put an unauthenticated scraper on
# the public internet: the runbook says why not to.
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
port=8443
local_url=http://127.0.0.1:3000

compose() {
  if command -v podman >/dev/null 2>&1; then podman compose -f "$root/cinepro/compose.yml" "$@"
  else docker compose -f "$root/cinepro/compose.yml" "$@"; fi
}
tailnet() {
  tailscale status --json | python3 -c "import sys,json;s=json.load(sys.stdin);print($1)"
}

if [ "${1:-}" = stop ]; then
  tailscale serve --https=$port off 2>/dev/null || true
  tailscale funnel --https=$port off 2>/dev/null || true
  compose down
  exit 0
fi

[ "${1:-}" = start ] || { echo "usage: $0 start [serve|funnel] | stop" >&2; exit 2; }
mode=${2:-serve}
[ "$mode" = serve ] || [ "$mode" = funnel ] || { echo "mode is serve or funnel" >&2; exit 2; }
[ -f "$root/cinepro/.env" ] || {
  echo "cinepro: copy cinepro/.env.example to cinepro/.env and set TMDB_API_KEY" >&2
  exit 1
}
# Without HTTPS certificates enabled for the tailnet, `tailscale serve` waits forever.
certs=$(tailnet 'len(s.get("CertDomains") or [])')
[ "$certs" -gt 0 ] || {
  echo "cinepro: enable HTTPS Certificates at https://login.tailscale.com/admin/dns, then" \
    "run this again" >&2
  exit 1
}
host=$(tailnet '"Self" in s and s["Self"]["DNSName"].rstrip(".")')
# The site and the Android app are two origins and Core's CORS setting takes one, so "*";
# the tailnet is what keeps strangers out.
CINEPRO_PUBLIC_URL="https://$host:$port" CINEPRO_CORS_ORIGIN='*' compose up -d --remove-orphans
until curl -fsS -o /dev/null "$local_url/"; do sleep 2; done
tailscale "$mode" --bg --https=$port "$local_url" >/dev/null
echo "cinepro: https://$host:$port (set VITE_CINEPRO_CORE_ORIGIN to it; docs/runbooks/cinepro.md)"
