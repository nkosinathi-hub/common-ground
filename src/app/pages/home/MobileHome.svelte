<script lang="ts">
  import { PenLine } from "@lucide/svelte"
  import { useAuth } from "@/features/auth"
  import { NotesCard } from "@/features/notes"
  import { ActivityFeed } from "@/features/notifications"
  import { RecommendationsInbox } from "@/features/recommendations"
  import { ContinueWatching } from "@/features/watch"
  import { buildHash, type HomeCardId } from "@/shared/domain"
  import { CollapsibleGroup, Fab, SectionHeader } from "@/shared/ui"
  import UpNext from "./UpNext.svelte"

  interface Props {
    spaceId: string
    spaceName: string
    cards: readonly HomeCardId[]
  }

  let { spaceId, spaceName, cards }: Props = $props()
  const { session } = useAuth()
  let writing = $state(false)
  const has = (id: HomeCardId) => cards.includes(id)
  const upNext = $derived(cards.filter((id) => ["calendar", "ideas", "coming_up"].includes(id)))
  const itemHref = (itemId: string) => buildHash({ name: "watch-item", spaceId, itemId })
</script>

<!-- M01: sections on the page, one card for what is next, the rest folded away. -->
{#if has("notes")}
  <section class="flex flex-col gap-item">
    <!-- The floating button writes a note, so the header offers the rest of them instead. -->
    <SectionHeader title="Notes for you" seeAll={buildHash({ name: "notes", spaceId })} />
    <NotesCard {spaceId} bind:writing limit={2} />
  </section>
{/if}
{#if has("continue_watching")}
  <!-- The row runs to the screen's edges: it bleeds by the page gutter, not a card's padding. -->
  <section class="flex flex-col gap-item [--bleed:var(--gutter)]">
    <SectionHeader title="Continue watching" />
    <ContinueWatching
      {spaceId}
      listHref={buildHash({ name: "watch", spaceId })}
      {itemHref}
      me={session.user?.id}
    />
  </section>
{/if}
{#if upNext.length}<UpNext {spaceId} cards={upNext} />{/if}
{#if has("activity") || has("recommended")}
  <CollapsibleGroup title="Activity and recommendations">
    <div class="flex flex-col gap-stack pt-item">
      {#if has("activity")}
        <section class="flex flex-col gap-related">
          <SectionHeader title="Recently in {spaceName}" level={3} />
          <ActivityFeed {spaceId} limit />
        </section>
      {/if}
      {#if has("recommended")}
        <SectionHeader title="Recommended for you" level={3} />
        <RecommendationsInbox
          {spaceId}
          {itemHref}
          libraryHref={buildHash({ name: "watch", spaceId })}
        />
      {/if}
    </div>
  </CollapsibleGroup>
{/if}
<!-- Above the tab bar, clear of the safe area. -->
<Fab
  icon={PenLine}
  label="Write a note"
  extended
  onclick={() => (writing = true)}
  class="fixed right-gutter bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30"
/>
