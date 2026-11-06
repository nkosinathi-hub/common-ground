<script lang="ts">
  import { ChevronDown, MessageCircle } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import type { TitleTab } from "@/shared/domain"
  import type { WatchItem } from "../domain/types"
  import type { DiscussionFrame } from "../domain/title-facts"
  import type { TitlePage } from "./title-page.svelte"
  import TitleAside from "./TitleAside.svelte"

  let {
    page,
    item,
    tab,
    discussion,
  }: {
    page: TitlePage
    item: WatchItem
    tab?: TitleTab
    discussion?: Snippet<[DiscussionFrame | null]>
  } = $props()
</script>

<details open={tab === "discussion" || tab === "progress"} class="group border-t border-border">
  <summary
    class="flex min-h-14 cursor-pointer list-none items-center gap-related rounded-md px-related type-sm text-muted-foreground outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
  >
    <MessageCircle class="size-4" aria-hidden="true" />
    <span class="flex-1">Progress and discussion</span>
    <ChevronDown
      class="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
      aria-hidden="true"
    />
  </summary>
  <div
    class="grid items-start gap-columns pt-stack lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1fr)]"
  >
    <aside class="min-w-0" aria-label="Your space's progress">
      <TitleAside {page} {item} wide />
    </aside>
    <div class="min-w-0">{@render discussion?.(page.frame)}</div>
  </div>
</details>
