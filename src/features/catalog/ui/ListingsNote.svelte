<script lang="ts">
  import { formatDateTime } from "@/shared/domain"

  /** When TMDB was last asked; the line waits until a listing has loaded. */
  let { checkedAt }: { checkedAt: string | null } = $props()
</script>

<!-- The page foot's one quiet line: where listings come from, how fresh they are. -->
{#if checkedAt}
  <p class="type-xs text-muted-foreground">
    Listings from
    <a
      class="underline underline-offset-2"
      href="https://www.themoviedb.org/"
      target="_blank"
      rel="noopener noreferrer">TMDB</a
    >
    and
    <a
      class="underline underline-offset-2"
      href="https://www.justwatch.com/"
      target="_blank"
      rel="noopener noreferrer">JustWatch</a
    >, checked <time datetime={checkedAt}>{formatDateTime(checkedAt)}</time>. Availability varies by
    region.
  </p>
{/if}
