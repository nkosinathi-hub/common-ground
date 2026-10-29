<script lang="ts">
  import { ChevronDown } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import * as Collapsible from "$lib/components/ui/collapsible"

  interface Props {
    title: string
    /** Short count beside the title, e.g. "2 new". */
    meta?: string
    open?: boolean
    children: Snippet
  }

  let { title, meta, open = $bindable(false), children }: Props = $props()
</script>

<!-- Figma Collapsible (208:3138): a card row that opens the rest of a long list. -->
<Collapsible.Root bind:open class="rounded-lg border border-border bg-card">
  <Collapsible.Trigger
    class="group/collapsible flex min-h-11 w-full items-center gap-item rounded-lg px-control-padding-default text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/20"
  >
    <span class="min-w-0 flex-1 truncate type-label text-foreground">{title}</span>
    {#if meta}<span class="type-xs text-muted-foreground">{meta}</span>{/if}
    <ChevronDown
      class="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180"
      aria-hidden="true"
    />
  </Collapsible.Trigger>
  <Collapsible.Content class="border-t border-border px-inset pb-inset">
    {@render children()}
  </Collapsible.Content>
</Collapsible.Root>
