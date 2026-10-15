# Supabase free tier quotas

Limits as understood for v0.1 planning; confirm current numbers on supabase.com/pricing before
relying on them.

| Resource             | Free tier limit (approx.)       | Our exposure                           |
| -------------------- | ------------------------------- | -------------------------------------- |
| Projects             | 2 active per organisation       | staging + production                   |
| Database size        | 500 MB                          | text rows; attachments are in Storage  |
| Storage              | 1 GB, 50 MB max file            | attachments capped at 10 MB each       |
| Egress               | 5 GB per month                  | signed URLs for attachments            |
| Monthly active users | 50,000                          | a handful of people per space          |
| Edge Function calls  | 500,000 per month               | catalog search, attachment finalize    |
| Realtime             | 200 concurrent connections      | one per open tab                       |
| Auth emails          | a few per hour on built-in SMTP | custom SMTP required ([smtp](smtp.md)) |
| Backups              | none downloadable, no PITR      | see [backup](backup.md)                |

## Pausing

Free projects pause after 7 days without activity. The GitLab `keep-alive` job
(`.gitlab/ci/deploy.yml`) runs on a daily pipeline schedule and calls the REST endpoint. Create
the schedule under Build > Pipeline schedules, target `main`, daily.

## Watching usage

Supabase dashboard > Usage, monthly. Act at 70 percent of any limit: prune `catalog_cache`,
clean orphaned attachments, or move to the Pro plan.
