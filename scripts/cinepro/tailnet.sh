# shellcheck shell=bash
# Tailscale helpers for server.sh (sourced). Needs `tailscale` and `python3`.

# Prints a Python expression evaluated over `tailscale status --json` as `s`.
tailnet() {
  tailscale status --json | python3 -c "import sys,json;s=json.load(sys.stdin);print($1)"
}

# Online with HTTPS certificate domains; a failing `tailscale status` (daemon not up) is not ready.
tailnet_ready() {
  [ "$(tailnet 's.get("BackendState") == "Running" and len(s.get("CertDomains") or []) > 0' 2>/dev/null)" = True ]
}

# At boot the service runs before tailscaled is up or the tailnet is online, so wait (bounded,
# CINEPRO_TAILNET_WAIT seconds). Without certificates `tailscale serve` would wait for ever.
wait_for_tailnet() {
  local deadline=$((SECONDS + ${CINEPRO_TAILNET_WAIT:-120}))
  until tailnet_ready; do
    [ "$SECONDS" -lt "$deadline" ] || {
      echo "cinepro: enable HTTPS Certificates at https://login.tailscale.com/admin/dns, then" \
        "run this again" >&2
      exit 1
    }
    sleep "${CINEPRO_TAILNET_POLL:-2}"
  done
}
