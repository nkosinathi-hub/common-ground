# Push notifications

How a notification reaches a phone, and what each environment needs for it to work.

## Path

1. A row lands in `public.notifications` (always through `public.notify`).
2. The `notifications_push` trigger (`20261021000200_push_delivery.sql`) skips recipients with
   no row in `push_devices`, reads the function URL and secret from Vault, and queues a pg_net
   POST `{"notificationId": ...}` with header `x-push-secret`. pg_net sends it after commit.
   Any error is swallowed (a `WARNING` with the SQLSTATE only), so a notification never fails.
3. The `push` Edge Function checks the secret, reads `push_targets(id)` as the service role,
   signs a Google OAuth assertion (RS256, WebCrypto) from `FCM_SERVICE_ACCOUNT`, and posts one
   FCM HTTP v1 message per device: title and body as the bell words it, `data.route` the hash
   route the bell opens. Tokens FCM reports as `UNREGISTERED` (or 404) are deleted.

pg_net was chosen over a pg_cron queue (a minute of latency, and a queue table to drain) and
over a dashboard Database Webhook (its URL and headers live in the trigger definition, so the
secret would sit in the schema). pg_net responses are kept for six hours in `net._http_response`.

## Secrets

- `PUSH_SECRET`: a function secret and the Vault entry `push_secret`, the same value in both.
  Generate it with `openssl rand -hex 32`; it must be hex because the deploy job quotes it into SQL.
- `FCM_SERVICE_ACCOUNT`: a function secret, the Firebase service-account key file as
  `base64 -w0 key.json`.
- `push_function_url`: Vault only, `<SUPABASE_URL>/functions/v1/push`, set by `configure_push`.

The service-account key comes from Firebase console > Project settings > Service accounts >
Generate new private key. Keep the JSON outside the repository and delete the download once the
CI variable is set. Its `project_id` names the FCM project; nothing else is configured.

## Production

Set masked, protected GitLab CI variables `PUSH_SECRET` and `FCM_SERVICE_ACCOUNT` before the
next `supabase-deploy` run. That job sets both as function secrets, then runs
`select public.configure_push('<SUPABASE_URL>/functions/v1/push', '<PUSH_SECRET>')` through
`supabase db query --linked`, which writes both Vault entries (idempotent). Until
`PUSH_SECRET` is set the Vault step is skipped and the trigger sends nothing.

## Staging and local

Staging: `supabase secrets set --project-ref <staging ref> PUSH_SECRET=... FCM_SERVICE_ACCOUNT=...`
and run the same `configure_push` query in the staging SQL editor. Locally nothing is configured,
so the trigger sends nothing. To try it, put both secrets in `supabase/functions/.env`, serve
functions, and run `select public.configure_push('http://kong:8000/functions/v1/push', '<secret>')`
in the local database (the database reaches the gateway by its container name).

## Checking and rotating

- Queued and answered calls: `select id, status_code, error_msg from net._http_response order by
created desc limit 20`. A 403 means the two copies of `PUSH_SECRET` differ.
- Rotate `PUSH_SECRET`: change the CI variable and re-run `supabase-deploy`, which updates both
  copies. Rotate the service-account key in Google Cloud IAM, update the variable, redeploy,
  then delete the old key.
