<script lang="ts">
  import { untrack } from "svelte"
  import { Check, Inbox, X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { EmptyState, ErrorState, Loading, toast } from "@/shared/ui"
  import type { Result } from "@/shared/domain"
  import type { RecommendationResponse } from "../domain/recommendation"
  import { useRecommendations } from "./context"
  import { InboxState } from "./inbox.svelte"

  let { spaceId, itemHref }: { spaceId: string; itemHref: (itemId: string) => string } = $props()

  const service = useRecommendations()
  const inbox = $derived(new InboxState(service, spaceId))
  $effect(() => {
    const current = inbox
    untrack(() => void current.load())
  })

  const report = (result: Result<void>) => {
    if (!result.ok) toast.error(result.error.message)
  }
  const answer = async (id: string, response: RecommendationResponse) =>
    report(await inbox.respond(id, response))
  const more = async () => report(await inbox.loadMore())
</script>

<section class="grid gap-3" aria-label="Recommended to you">
  {#if inbox.status === "loading"}
    <Loading />
  {:else if inbox.status === "error" && inbox.error}
    <ErrorState error={inbox.error} onRetry={inbox.retry} />
  {:else if inbox.items.length === 0}
    <EmptyState
      icon={Inbox}
      title="Nothing waiting for you"
      description="When someone recommends a title to you, it shows up here."
    />
  {:else}
    <ul class="grid gap-2">
      {#each inbox.items as rec (rec.id)}
        <li class="grid gap-1 rounded-lg border p-3">
          <a class="font-medium underline-offset-4 hover:underline" href={itemHref(rec.itemId)}
            >{rec.itemTitle ?? "A saved title"}</a
          >
          <p class="text-xs text-muted-foreground">From {rec.senderName ?? "a former member"}</p>
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
    {#if inbox.hasMore}
      <Button variant="ghost" size="sm" disabled={inbox.loadingMore} onclick={more}
        >Show more</Button
      >
    {/if}
  {/if}
</section>
