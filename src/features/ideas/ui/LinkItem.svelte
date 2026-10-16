<script lang="ts">
  import { ExternalLink } from "@lucide/svelte"
  import { DeleteButton } from "@/shared/ui"
  import type { ResearchLink } from "../domain"

  interface Props {
    link: ResearchLink
    deletable: boolean
    onRemove: () => unknown
  }

  let { link, deletable, onRemove }: Props = $props()
</script>

<li
  class="flex items-start justify-between gap-2 rounded-lg border p-3"
  data-testid="research-link"
>
  <div class="min-w-0">
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      class="inline-flex items-center gap-1 font-medium hover:underline"
      >{link.title}<ExternalLink class="size-3" /></a
    >
    <p class="truncate text-xs text-muted-foreground">{link.url}</p>
    {#if link.description}<p class="text-sm">{link.description}</p>{/if}
  </div>
  {#if deletable}
    <DeleteButton label="Delete link {link.title}" what="this link" onConfirm={onRemove} />
  {/if}
</li>
