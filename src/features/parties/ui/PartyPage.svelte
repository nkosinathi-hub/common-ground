<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import { ChevronLeft } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ErrorState, FormError, FormState, Loading, Resource, TextLink } from "@/shared/ui"
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

<!-- No frame: back to the title, the party, then who is in beside the controls (as D03a). -->
<article class="flex flex-col gap-section">
  {#if room.error}
    <ErrorState error={room.error} />
  {:else if !room.party}
    <Loading />
  {:else}
    {@const party = room.party}
    <header class="flex flex-col gap-stack">
      <TextLink href={itemHref(party.watchItemId)} icon={ChevronLeft} class="w-fit flex-row-reverse"
        >Back to the title</TextLink
      >
      <div class="flex flex-col gap-related">
        <h1 class="type-h1 text-foreground">Watch party</h1>
        {#if party.range}<p class="type-body text-muted-foreground">
            {describeRange(party.range)}
          </p>{/if}
      </div>
    </header>
    {#if isOpen(party) && room.view}
      {#if party.source === "jellyfin" && player}{@render player(party)}{/if}
      <div class="grid items-start gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
        {#if party.source === "external"}
          <CoWatchPanel {room} />
        {:else if party.source === "netflix"}
          <NetflixPanel {room} title={party.title} />
        {:else}
          <LiveControls {room} view={room.view} />
        {/if}
        <PartyPeople {party} view={room.view} names={names.value ?? []} />
      </div>
      <div class="flex flex-wrap gap-related">
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
      <p class="rounded-lg bg-muted p-inset type-sm text-foreground">
        {party.status === "cancelled"
          ? "This party was cancelled. Nobody's progress moved."
          : "This party has ended. Everyone who confirmed has it in their history."}
      </p>
    {/if}
  {/if}
</article>
