# Simkl import

Optional. A member links their own Simkl account on the Account page and their watch history
is ticked onto titles already on their lists, in every space they belong to. Nothing is sent
to Simkl; history only comes in. Simkl's API is free for non-commercial apps.

## Path

1. **Connect.** The Account card calls the `simkl` Edge Function (`pin`), which asks Simkl for
   a PIN (`GET /oauth/pin`). The card shows the code and a link to `simkl.com/pin`, then polls
   (`poll`, `GET /oauth/pin/{code}`) at Simkl's interval until the member approves it, the
   code expires (15 minutes) or the card closes. On approval the function stores the access
   token in `public.simkl_links` with the service-role client.
2. **Sync.** "Sync now", and once per app open while connected (never on a timer: Simkl asks
   apps not to poll in the background), calls `sync`. The function reads `/sync/activities`
   first, then `/sync/all-items/shows` and `/movies` (`extended=full`, `episode_watched_at=yes`,
   `date_from` = the stored cursor) only for the kinds whose activity moved. Each watched
   episode, and each completed film, is matched by TMDB id to `watch_items` and written by
   `import_simkl_watches` as `episode_watches` rows with source `simkl`; the forward-only
   trigger then moves the member's place. A watch already recorded for the same title,
   season, episode and time is skipped, so re-syncs add nothing. The cursor advances to the
   activities time in the same transaction, and only when every read succeeded.
3. **Disconnect** deletes the row. A token Simkl refuses (401) is deleted the same way, and
   the card asks to connect again. History already imported stays.

Titles not on any list are ignored, and so is anime (Simkl keeps it apart from shows).

## Data and security

- The token column is granted to no client role: members read only `cursor`, `connected_at`
  and `last_synced_at` of their own row and may delete it (`simkl_links.test.sql`).
  `import_simkl_watches` executes for `service_role` only (`simkl_import.test.sql`).
- The personal export carries the link without the token (`simkl_export.test.sql`).
- The function checks the JWT and `ALLOWED_ORIGINS`, and rate-limits each user to 20 calls a
  minute through the shared `rate_limits` gate. It never logs tokens or Simkl replies.
- Processor: Simkl (simkl.com) holds the member's own Simkl account; we keep only the token.

## Set up

1. Sign in at simkl.com, open Settings > Developer (https://simkl.com/settings/developer/),
   and create an app named "Common Ground". The PIN flow never uses its redirect URI, so any
   value the form accepts will do (`urn:ietf:wg:oauth:2.0:oob` is the usual one). Copy the
   client id; the client secret is not used.
2. Set it as a function secret: `pnpm exec supabase secrets set SIMKL_CLIENT_ID=<id>`
   (add `--project-ref <ref>` for staging). Locally, add the line to `supabase/functions/.env`.
3. Production: add the masked GitLab CI variable `SIMKL_CLIENT_ID`; `supabase-deploy`
   (`.gitlab/ci/deploy.yml`) passes it to `supabase secrets set` with the others.
4. Deploy the function (`supabase functions deploy simkl`, or the deploy job).

While `SIMKL_CLIENT_ID` is unset every action answers 503 "Simkl import is not set up on this
server yet", and the card shows that sentence.

## Caveats

- The PIN flow is Simkl's AUTH V1. Simkl documents it as deprecated, retiring around April
  2027, in favour of an OAuth 2.0 device flow (`POST /oauth2/device`, short-lived tokens with a
  refresh token). A client id created as V2 is refused by the V1 flow; if registration only
  offers V2, the function needs the device flow and a refresh token column first.
- `SIMKL_BASE_URL` overrides `https://api.simkl.com` for tests against a stub.
