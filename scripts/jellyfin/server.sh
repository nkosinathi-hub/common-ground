#!/usr/bin/env bash
# Runs Jellyfin 12.2 for Common Ground in rootless podman, then publishes it over HTTPS with
# Tailscale (docs/runbooks/jellyfin.md). Usage:
#   scripts/jellyfin/server.sh start <media folder> [serve|funnel]
#   scripts/jellyfin/server.sh stop
# `serve` reaches devices on your tailnet only; `funnel` makes it public (her phone needs no
# Tailscale), so read the runbook's hardening list first.
set -euo pipefail

name=common-ground-jellyfin
image=docker.io/jellyfin/jellyfin:12.2
state=${JELLYFIN_STATE:-$HOME/.local/share/common-ground-jellyfin}

if [ "${1:-}" = stop ]; then
  tailscale serve --https=443 off 2>/dev/null || true
  tailscale funnel --https=443 off 2>/dev/null || true
  podman rm -f "$name" >/dev/null
  exit 0
fi

[ "${1:-}" = start ] || { echo "usage: $0 start <media folder> [serve|funnel] | stop" >&2; exit 2; }
media=${2:?pass the folder that holds your films and shows}
mode=${3:-serve}
[ "$mode" = serve ] || [ "$mode" = funnel ] || { echo "mode is serve or funnel" >&2; exit 2; }
mkdir -p "$state/config" "$state/cache"

# Media is mounted read-only; :z (shared label) because other containers may read it too.
podman container exists "$name" || podman run -d --name "$name" --restart unless-stopped \
  -p 127.0.0.1:8096:8096 \
  -v "$state/config:/config:z" -v "$state/cache:/cache:z" -v "$media:/media:ro,z" \
  "$image" >/dev/null

until curl -fsS -o /dev/null http://127.0.0.1:8096/health; do sleep 2; done
tailscale "$mode" --bg --https=443 http://127.0.0.1:8096 >/dev/null
host=$(tailscale status --json | python3 -c 'import sys,json;print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')
echo "jellyfin: https://$host (finish setup there, then see docs/runbooks/jellyfin.md)"
