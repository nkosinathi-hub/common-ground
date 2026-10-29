<script lang="ts">
  import { cn } from "$lib/utils"

  /** Compact sits at the foot of a card; the default closes a page section with a rule. */
  let { compact = false }: { compact?: boolean } = $props()
  const logo = `${import.meta.env.BASE_URL}tmdb-logo.svg`
</script>

<!-- Required by the TMDB and JustWatch terms wherever catalog data shows (docs/runbooks/tmdb-terms.md). -->
<footer
  class={cn(
    "flex flex-col gap-hairline type-xs text-muted-foreground",
    !compact && "mt-section border-t border-border pt-stack",
  )}
>
  <a
    href="https://www.themoviedb.org/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="The Movie Database (TMDB)"
    class="mb-hairline inline-flex w-fit"
  >
    <img src={logo} alt="TMDB" width="78" height="10" />
  </a>
  <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
  <p>
    Streaming data by
    <a
      class="underline underline-offset-2"
      href="https://www.justwatch.com/"
      target="_blank"
      rel="noopener noreferrer">JustWatch</a
    >
  </p>
</footer>
