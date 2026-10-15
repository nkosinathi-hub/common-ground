# Rollback

## Frontend (GitHub Pages)

Pages serves whatever the last successful workflow run deployed.

1. Fastest: GitHub > Actions > "Deploy to GitHub Pages" > open the last good run > "Re-run all
   jobs". It rebuilds that commit and redeploys it.
2. Durable: on GitLab, revert the bad commit on a branch, merge it to `main`; the mirror pushes
   and Pages redeploys.

Never force-push `main`: the mirror would diverge.

## Database (migrations)

Migrations are forward-only. To undo one:

1. Write a new migration that reverses it (drop the column, restore the policy) with a pgTAP
   test proving the old behaviour is back.
2. Merge, then run the manual `supabase-deploy` job on `main`.

If data was destroyed, restore it from the latest dump ([backup](backup.md)) into a local stack,
then copy the affected rows back with a reviewed SQL script.

## Edge Functions

Redeploy the previous version: check out the last good commit locally and run
`pnpm exec supabase functions deploy <name> --project-ref <ref>`.

## Secrets

If a rollback is due to a leaked secret, follow rotation in [secrets](secrets.md) first.

## After any rollback

Open a Bug issue (template) describing cause, impact and the test that would have caught it.
