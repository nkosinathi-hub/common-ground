<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import { ArrowLeft } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { AsyncView, Resource } from "@/shared/ui"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import ItemAvailability from "./ItemAvailability.svelte"
  import ItemHeader from "./ItemHeader.svelte"
  import ProgressPanel from "./ProgressPanel.svelte"
  import SessionsPanel from "./SessionsPanel.svelte"

  interface Props {
    spaceId: string
    itemId: string
    backHref: string
    /** Comment thread for this title, rendered below progress. */
    comments?: Snippet
    /** "Recommend to a member" control, rendered with the title actions. */
    recommend?: Snippet
    /** "Watch together" for this title; told whether it is a film (no episodes to pick). */
    together?: Snippet<[boolean]>
    /** Watch-here player for the title, rendered under the header. */
    play?: Snippet<[WatchItem, () => void]>
  }

  let { spaceId, itemId, backHref, comments, recommend, together, play }: Props = $props()
  const { service, members, authors } = useWatch()
  const view = new Resource(() => service.get(spaceId, itemId))
  const people = new Resource(() => members.members(spaceId))
  const names = new Resource(() => authors.authors(spaceId))
  let progressVersion = $state(0)

  $effect(() => {
    // Reload when the space or title changes; the loads must not become dependencies.
    void [spaceId, itemId]
    untrack(() => {
      void view.load()
      void people.load()
      void names.load()
    })
  })
</script>

<article class="mx-auto max-w-5xl space-y-6">
  <Button variant="ghost" size="sm" href={backHref}>
    <ArrowLeft aria-hidden="true" />
    Back to the list
  </Button>
  <AsyncView resource={view}>
    {#snippet children(current)}
      <ItemHeader view={current} {backHref} {recommend} onChanged={() => view.load()} />
      {@render play?.(current.item, () => {
        progressVersion++
        void view.load()
      })}
      {#if together}{@render together(current.item.mediaType === "movie")}{/if}
      <ItemAvailability {spaceId} item={current.item} />
      <div class="grid gap-6 lg:grid-cols-2">
        <ProgressPanel
          item={current.item}
          authors={names.value ?? people.value ?? []}
          version={progressVersion}
          onSaved={() => {
            progressVersion++
            void view.load()
          }}
        />
        <SessionsPanel
          item={current.item}
          members={people.value ?? []}
          authors={names.value ?? people.value ?? []}
          onLogged={() => {
            progressVersion++
            void view.load()
          }}
        />
      </div>
      {#if comments}
        <section aria-label="Conversation" class="border-t pt-6">{@render comments()}</section>
      {/if}
    {/snippet}
  </AsyncView>
</article>
