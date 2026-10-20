# Simkl import

Optional. A member links their own Simkl account on the Account page and their watch history
is ticked onto titles already on their lists, in every space they belong to. Nothing is sent
to Simkl; history only comes in. Simkl's API is free for non-commercial apps.

## Path (Simkl AUTH V2, the OAuth 2.0 device flow)

1. **Connect.** The card calls the `simkl` Edge Function (`pin`), which posts
   `/oauth2/device` with `scope=media:read`. The browser gets only the user code, the
   approval page with the code filled in (`verification_uri_complete`, the main link), the
   plain page and the code as a fallback, the interval and the expiry. The device code is a
   credential: it is stored in `simkl_links` with its expiry and never returned or logged.
2. **Approve.** The card polls `poll` at the returned interval. The function posts
   `/oauth2/token` (device grant) with the stored code: `authorization_pending` keeps waiting,
   `slow_down` adds 5 seconds to the interval, `expired_token` (or the stored expiry) forgets
   the code, `401 invalid_client` answers "not set up". A grant without `media:read` is
   refused. On success it stores the access token, the refresh token and the access expiry,
   and marks the row connected. The card stops when connected, expired (15 minutes) or closed.
3. **Sync.** "Sync now", and once per app open while connected (never on a timer: Simkl asks
   apps not to poll in the background), calls `sync`. It reads `/sync/activities`, then
   `/sync/all-items/shows` and `/movies` since the stored cursor, only for kinds that moved,
   and imports through `import_simkl_watches`: each watched episode and completed film,
   matched by TMDB id to `watch_items`, becomes an `episode_watches` row with source `simkl`,
   once. The cursor advances only when every read succeeded. Anime is ignored.
4. **Disconnect** posts `/oauth2/revoke` with the refresh token (it revokes the whole grant)
   and deletes the row, even if the revoke fails. Imported history stays.

## Tokens

- Access token: 7 days. Refresh token: 180 days, sliding, non-rotating (the same one comes
  back). Only this function refreshes: within a day of expiry, or once after a 401, then it
  retries once. A refresh that Simkl refuses (400 or 401) deletes the link and the card asks
  to connect again; an outage keeps a still valid token.
- Simkl invalidates the previous access token on every refresh, so two overlapping refreshes
  would cut each other off. The function first takes a 30 second per-user lease
  (`claim_simkl_refresh`); a second sync waits for the new token instead of refreshing.

## Data and security

- No client role can read or write the tokens, the device code or their expiries; members
  read only `cursor`, `connected_at` and `last_synced_at` of their own connected row and may
  delete it (`simkl/*.test.sql`). The import and lease functions are `service_role` only.
- The personal export carries the link without any token.
- The function checks the JWT and `ALLOWED_ORIGINS` and rate-limits each user to 20 calls a
  minute. Tokens and codes go to Simkl only in form bodies or the Authorization header.
- Every request carries `client_id`, `app-name=common-ground`, `app-version` and the
  User-Agent `common-ground/<version>` (the version is pinned to package.json by a test).

## Set up

1. At https://simkl.com/settings/developer/ create an app with the client type for devices
   and apps without a server (it sends only the client id; a Server app would need a secret).
   AUTH V1 client ids are refused by V2 (`401 invalid_client`), and the card then says "not
   set up". Copy the client id.
2. `pnpm exec supabase secrets set SIMKL_CLIENT_ID=<id>` (add `--project-ref <ref>` for
   staging); locally, the line goes in `supabase/functions/.env`.
3. Production: the masked GitLab CI variable `SIMKL_CLIENT_ID`; `supabase-deploy` sets it as a
   function secret when present (`.gitlab/ci/deploy.yml`).

While it is unset every action answers 503 "Simkl import is not set up on this server yet".
`SIMKL_BASE_URL` points the function at a stub Simkl for tests.
