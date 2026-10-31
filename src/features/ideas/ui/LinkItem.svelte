<script lang="ts">
  import { Link } from "@lucide/svelte"
  import { DeleteButton } from "@/shared/ui"
  import type { ResearchLink } from "../domain"

  interface Props {
    link: ResearchLink
    deletable: boolean
    onRemove: () => unknown
  }

  let { link, deletable, onRemove }: Props = $props()
  /** "cederberg.com": where the link goes, without the scheme or path. */
  const siteOf = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "")
    } catch {
      return url
    }
  }
</script>

<!-- D07 link row: the site's icon tile, the title as the link, its site and why it matters. -->
<li class="flex items-center gap-item py-item" data-testid="research-link">
  <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
    <Link class="size-5 text-foreground" aria-hidden="true" />
  </span>
  <div class="flex min-w-0 flex-1 flex-col">
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      class="truncate type-label text-foreground hover:underline">{link.title}</a
    >
    <p class="truncate type-xs text-muted-foreground">
      {[siteOf(link.url), link.description].filter(Boolean).join(" · ")}
    </p>
  </div>
  {#if deletable}
    <DeleteButton label="Delete link {link.title}" what="this link" onConfirm={onRemove} />
  {/if}
</li>
