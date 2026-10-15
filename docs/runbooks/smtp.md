# SMTP (Resend)

Supabase's built-in mailer allows only a few emails per hour, too few for sign-up verification
and password resets. Production uses Resend's free tier as custom SMTP.

## Local

No SMTP needed. `supabase start` runs Mailpit (`[local_smtp]` in `supabase/config.toml`) and
every auth email lands at http://127.0.0.1:54324. Playwright reads links from its API
(`tests/e2e/support/mailpit.ts`).

## Production

1. Create a Resend account and verify the sending domain (SPF and DKIM DNS records).
2. Create an API key restricted to sending. Store it only in the Supabase dashboard.
3. Supabase dashboard > Authentication > SMTP settings:
   - Host `smtp.resend.com`, port `465`, user `resend`, password = the API key
   - Sender `no-reply@<your domain>`, sender name `Common Ground`
4. Authentication > Rate limits: raise "emails per hour" to what the Resend plan allows.
5. Authentication > URL configuration: site URL `https://<github user>.github.io/common-ground/`
   and the same URL in redirect URLs.
6. Smoke test: sign up with a real address, click the link, then request a password reset.

## Failure modes

- Links open the wrong host: the site URL or redirect list in step 5 is wrong.
- Emails never arrive: check Resend's log first, then the Supabase Auth logs.
- "Email rate limit exceeded": the Supabase limit in step 4 is lower than demand.
