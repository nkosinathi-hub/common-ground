<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import { ArrowLeft } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { AsyncView, Resource } from "@/shared/ui"
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
  }

  let { spaceId, itemId, backHref, comments, recommend }: Props = $props()
  const { service, members } = useWatch()
  const view = new Resource(() => service.get(spaceId, itemId))
  const people = new Resource(() => members.members(spaceId))
  let progressVersion = $state(0)

  $effect(() => {
    void [spaceId, itemId]
    untrack(() => {
      void view.load()
      void people.load()
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
      <ItemAvailability {spaceId} item={current.item} />
      <div class="grid gap-6 lg:grid-cols-2">
        <ProgressPanel
          item={current.item}
          members={people.value ?? []}
          version={progressVersion}
          onSaved={() => view.load()}
        />
        <SessionsPanel
          item={current.item}
          members={people.value ?? []}
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
