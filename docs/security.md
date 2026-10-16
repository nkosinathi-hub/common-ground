# Security

Threat model for v0.1. Mechanisms are recorded in [ADR 0003](adr/0003-rls-and-rpcs.md); this page
says what they defend against.

## Assets

- Space content: watchlists, ratings, comments, ideas, budgets, tasks, attachments.
- Personal data: email, display name, membership, activity (POPIA personal information).
- Credentials: the Supabase service-role key, TMDB token, SMTP key, deploy tokens.

## Actors

| Actor                     | Can                                   | Must not                             |
| ------------------------- | ------------------------------------- | ------------------------------------ |
| Member                    | read and write their spaces' content  | touch other spaces                   |
| Owner                     | manage members, invites, delete space | read other spaces                    |
| Removed member            | nothing in that space                 | keep access through a cached session |
| Other signed-in user      | their own spaces only                 | read anything by guessing UUIDs      |
| Anonymous visitor         | public pages, invite preview by token | list spaces, enumerate invites       |
| Holder of a leaked invite | join once, before expiry              | reuse, or use after revocation       |

## Controls

- **RLS isolation.** Every table denies by default; policies call `is_space_member` and
  `is_space_owner`, which read current membership, so removal is immediate. Cross-space
  references are blocked by composite foreign keys. Proven by pgTAP in
  `supabase/tests/database/` (third user, removed member, guessed UUIDs).
- **Privileged operations** run as security-definer RPCs with `search_path = ''`, an
  `auth.uid()` check and explicit grants.
- **Invites** store only a token hash, expire after 7 days, are single use, and are revocable.
- **Secrets never in the bundle.** The browser only receives the URL and publishable key.
  `scripts/guard/bundle-scan.ts` fails the guard and CI if `dist/` contains a service-role marker,
  an `sb_secret_` key or any value from `supabase/functions/.env`. See
  [secrets runbook](runbooks/secrets.md).
- **Edge Functions** verify the caller's JWT and membership, check the `Origin` against
  `ALLOWED_ORIGINS`, and rate-limit through the service-only `rate_limits` table.
- **Attachments** are in a private bucket, checked by magic bytes and size (10 MB), served only
  through short-lived signed URLs to members.
- **Space pictures** (avatar and cover) are in the private `space-media` bucket: JPEG, PNG or
  WebP only (no SVG), at most 5 MB, at most 6 objects per space. Only the owner uploads and
  deletes, members read through signed URLs, nobody updates an object. Image content is not
  sniffed; the client re-encodes uploads to WebP, which strips metadata. A signed URL keeps
  working for up to an hour after a member is removed. Orphaned objects are listed by
  `space_media_cleanup_candidates()` and removed by the cleanup Edge Function.
- **Exports** run as security definer, so `export_table_filter` repeats each table's select
  policy: private notes, their replies, other people's recommendations and reminders never leave.
- **No user HTML.** ESLint forbids `{@html}` and `innerHTML`; research links accept http(s) only.
- **Auth** uses PKCE; the callback scrubs `?code=` from the URL before the router runs.

## POPIA

South Africa's Protection of Personal Information Act applies to members' data.

- Minimality: email, display name and what members choose to write. No third-party analytics,
  no tracking cookies.
- Openness: the privacy notice at `#/privacy`.
- Access and correction: members export their personal data and each space as JSON.
- Deletion: self-service account deletion.
- Status: export and deletion are v0.1 requirements (plan item 18) not yet merged to `1-v0-1`;
  until they land, the maintainer handles requests manually.
- Security safeguards: the controls above. Breach response: rotate secrets, assess, notify
  affected members and the Information Regulator without undue delay.
- Processors: Supabase (hosting), Resend (email), TMDB (catalog lookups carry no personal data).

## Reporting

Report a vulnerability privately to the maintainer (GitLab @nkosinathi1), not in a public issue.
