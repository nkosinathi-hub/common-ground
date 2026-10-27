#!/usr/bin/env bash
# Runs CinePro Core for Common Ground (cinepro/compose.yml) in rootless podman or Docker, then
# publishes it over HTTPS with Tailscale on port 8443, beside Jellyfin on 443
# (docs/runbooks/cinepro.md). Usage:
#   scripts/cinepro/server.sh install [serve|funnel]
#   scripts/cinepro/server.sh start [serve|funnel]
#   scripts/cinepro/server.sh stop
# `install` enables the selected mode at boot using a systemd user service. Funnel is public and
# unauthenticated; see docs/runbooks/cinepro.md.
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
port=8443
local_url=http://127.0.0.1:3000
unit=common-ground-cinepro.service

compose() {
  if command -v podman >/dev/null 2>&1; then podman compose -f "$root/cinepro/compose.yml" "$@"
  else docker compose -f "$root/cinepro/compose.yml" "$@"; fi
}
tailnet() {
  tailscale status --json | python3 -c "import sys,json;s=json.load(sys.stdin);print($1)"
}

stop_service() {
  tailscale serve --https=$port off 2>/dev/null || true
  tailscale funnel --https=$port off 2>/dev/null || true
  compose down
}

if [ "${1:-}" = stop ]; then
  if command -v systemctl >/dev/null 2>&1 && systemctl --user is-enabled "$unit" >/dev/null 2>&1; then
    systemctl --user disable --now "$unit"
  fi
  stop_service
  exit 0
fi

[ "${1:-}" = start ] || [ "${1:-}" = install ] || {
  echo "usage: $0 install [serve|funnel] | start [serve|funnel] | stop" >&2
  exit 2
}
mode=${2:-funnel}
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

if [ "$1" = install ]; then
  command -v systemctl >/dev/null 2>&1 || { echo "cinepro: systemd is required for install" >&2; exit 1; }
  unit_dir=${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user
  mkdir -p "$unit_dir"
  cat >"$unit_dir/$unit" <<EOF
[Unit]
Description=Common Ground CinePro playback service
After=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart="$root/scripts/cinepro/server.sh" start $mode

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now "$unit"
  if command -v loginctl >/dev/null 2>&1; then
    loginctl enable-linger "$USER" || {
      echo "cinepro: installed, but boot startup needs lingering; run: sudo loginctl enable-linger $USER" >&2
      exit 1
    }
  fi
  echo "cinepro: installed $mode to start at boot; use '$0 stop' to disable and stop it"
  exit 0
fi
# The site and the Android app are two origins and Core's CORS setting takes one, so "*".
CINEPRO_PUBLIC_URL="https://$host:$port" CINEPRO_CORS_ORIGIN='*' compose up -d --remove-orphans
until curl -fsS -o /dev/null "$local_url/"; do sleep 2; done
if [ "$mode" = funnel ]; then
  # systemd has no interactive terminal; --yes avoids waiting for CLI confirmation.
  tailscale funnel --bg --yes --https=$port "$local_url"
else
  tailscale serve --bg --https=$port "$local_url"
fi
echo "cinepro: https://$host:$port (set VITE_CINEPRO_CORE_ORIGIN to it; docs/runbooks/cinepro.md)"
