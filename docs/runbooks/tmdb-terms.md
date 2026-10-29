# TMDB and JustWatch terms

The catalog uses the TMDB API (free, non-commercial use) and TMDB's watch-provider data, which
comes from JustWatch. Both require attribution.

## What the app must show

Implemented in `src/features/catalog/ui/Attribution.svelte`, rendered once in Account and data
(`src/app/pages/account/CatalogCredits.svelte`), beside the data export (Nkosi, 2026-10-29). The
title page carries one quiet line instead: "Listings from TMDB and JustWatch, checked …"
(`ListingsNote.svelte`), which credits and links both sources where the data shows.

- The TMDB logo (`public/tmdb-logo.svg`), linking to https://www.themoviedb.org/, less prominent
  than the app's own branding.
- The sentence: "This product uses the TMDB API but is not endorsed or certified by TMDB."
- Streaming availability credited to JustWatch with a link to https://www.justwatch.com/.

## What the app must not do

- Use the TMDB name or logo to imply endorsement, or modify the logo's colours or proportions.
- Cache TMDB data indefinitely. The catalog cache keeps searches 15 minutes and details 24 hours
  (`supabase/functions/_shared/catalog/cache.ts`) and labels stale data.
- Expose the TMDB token to the browser. Requests go through the catalog Edge Function, which also
  rate-limits each user (30 requests per 60 seconds).
- Charge for access. Commercial use needs a separate TMDB licence.

## Before a public release

Re-read the current TMDB API terms and logo guidelines and update this page if they changed.
