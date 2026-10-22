<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import { ArrowLeft } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ErrorState, FormError, FormState, Loading, Resource } from "@/shared/ui"
  import { describeRange } from "../domain/episode-range"
  import { isOpen, type Party } from "../domain/party"
  import CoWatchPanel from "./CoWatchPanel.svelte"
  import { useParties } from "./context"
  import LiveControls from "./LiveControls.svelte"
  import NetflixPanel from "./NetflixPanel.svelte"
  import { PartyRoomState } from "./party-room-state.svelte"
  import PartyPeople from "./PartyPeople.svelte"

  interface Props {
    spaceId: string
    partyId: string
    /** The signed-in member's id. */
    me: string
    itemHref: (itemId: string) => string
    /** The in-app player for an in-app party; the party drives whatever video it shows. */
    player?: Snippet<[Party]>
  }

  let { spaceId, partyId, me, itemHref, player }: Props = $props()
  const context = useParties()
  const room = untrack(() => new PartyRoomState(context, partyId, me))
  const names = new Resource(() => context.members.members(spaceId))
  const action = new FormState()

  $effect(() => {
    untrack(() => {
      void room.open()
      void names.load()
    })
    return () => room.close()
  })
</script>

<article class="mx-auto max-w-3xl space-y-6">
  {#if room.error}
    <ErrorState error={room.error} />
  {:else if !room.party}
    <Loading />
  {:else}
    {@const party = room.party}
    <Button variant="ghost" size="sm" href={itemHref(party.watchItemId)}>
      <ArrowLeft aria-hidden="true" />
      Back to the title
    </Button>
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Watch party</h1>
      {#if party.range}<p class="text-muted-foreground">{describeRange(party.range)}</p>{/if}
    </header>
    {#if isOpen(party) && room.view}
      {#if party.source === "jellyfin" && player}{@render player(party)}{/if}
      <PartyPeople {party} view={room.view} names={names.value ?? []} />
      {#if party.source === "external"}
        <CoWatchPanel {room} />
      {:else if party.source === "netflix"}
        <NetflixPanel {room} title={party.title} />
      {:else}
        <LiveControls {room} view={room.view} />
      {/if}
      <div class="flex flex-wrap gap-2">
        {#if room.view.ready || (party.source === "netflix" && room.view.state.phase !== "lobby")}
          <Button onclick={() => action.run(() => room.finish())}>We finished</Button>
        {/if}
        {#if room.view.isHost}
          <Button variant="ghost" onclick={() => action.run(() => room.cancel())}>
            Cancel the party
          </Button>
        {/if}
      </div>
      <FormError message={action.formError} />
    {:else}
      <p class="rounded-xl border p-4 text-sm">
        {party.status === "cancelled"
          ? "This party was cancelled. Nobody's progress moved."
          : "This party has ended. Everyone who confirmed has it in their history."}
      </p>
    {/if}
  {/if}
</article>
