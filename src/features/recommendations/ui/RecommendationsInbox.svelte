<script lang="ts">
  import { untrack } from "svelte"
  import { Check, Inbox, X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { EmptyState, ErrorState, Loading, LoadMore, toast } from "@/shared/ui"
  import { FORMER_MEMBER } from "@/shared/domain"
  import type { RecommendationResponse } from "../domain/recommendation"
  import { useRecommendations } from "./context"
  import { InboxState } from "./inbox-state.svelte"

  interface Props {
    spaceId: string
    itemHref: (itemId: string) => string
  }
  let { spaceId, itemHref }: Props = $props()

  const { service } = useRecommendations()
  const inbox = $derived(new InboxState(service, spaceId))
  const list = $derived(inbox.list)
  $effect(() => {
    void inbox
    untrack(() => inbox.load())
  })

  async function answer(id: string, response: RecommendationResponse) {
    const failure = await inbox.respond(id, response)
    if (failure) toast.error(failure.message)
  }
</script>

<section class="grid gap-3" aria-label="Recommended to you">
  {#if list.items.length > 0}
    <ul class="grid gap-2">
      {#each list.items as rec (rec.id)}
        <li class="grid gap-1 rounded-lg border p-3">
          <a class="font-medium underline-offset-4 hover:underline" href={itemHref(rec.itemId)}
            >{rec.itemTitle ?? "A saved title"}</a
          >
          <p class="text-xs text-muted-foreground">From {rec.senderName ?? FORMER_MEMBER}</p>
          {#if rec.note}<p class="text-sm break-words whitespace-pre-wrap">{rec.note}</p>{/if}
          <div class="flex gap-2">
            <Button
              size="sm"
              aria-label={`Acknowledge ${rec.itemTitle ?? "recommendation"}`}
              onclick={() => answer(rec.id, "acknowledged")}
              ><Check aria-hidden="true" />Acknowledge</Button
            >
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Dismiss ${rec.itemTitle ?? "recommendation"}`}
              onclick={() => answer(rec.id, "dismissed")}><X aria-hidden="true" />Dismiss</Button
            >
          </div>
        </li>
      {/each}
    </ul>
  {:else if list.error}
    <ErrorState error={list.error} onRetry={inbox.load} />
  {:else if list.loading}
    <Loading />
  {:else}
    <EmptyState
      icon={Inbox}
      title="Nothing waiting for you"
      description="When someone recommends a title to you, it shows up here."
    />
  {/if}
  <LoadMore {list} label="Show more" />
</section>
