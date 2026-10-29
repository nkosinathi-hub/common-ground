<script lang="ts">
  import { Pencil, Users } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { Separator } from "$lib/components/ui/separator"
  import type { MemberRef } from "@/shared/domain"
  import { DialogShell, type Resource } from "@/shared/ui"
  import { placeLabel } from "../domain/places"
  import type { MemberProgress } from "../domain/progress-types"
  import { memberRows, type SeasonFact } from "../domain/title-facts"
  import type { WatchItem } from "../domain/types"
  import MemberProgressRow from "./MemberProgressRow.svelte"
  import ProgressForm from "./ProgressForm.svelte"
  import SessionLog from "./SessionLog.svelte"

  interface Props {
    item: WatchItem
    progress: Resource<MemberProgress>
    seasons: readonly SeasonFact[]
    members: readonly MemberRef[]
    authors: readonly MemberRef[]
    version: number
    onChanged: () => void
  }

  let { item, progress, seasons, members, authors, version, onChanged }: Props = $props()
  let adjusting = $state(false)
  const current = $derived(progress.value)
  const rows = $derived(current ? memberRows(current.entries, current.me, authors, seasons) : [])
  const mine = $derived(current?.entries.find((e) => e.userId === current.me) ?? null)
  const together = $derived(current?.together ? placeLabel(current.together) : null)
  const season = $derived(mine?.season ?? current?.together?.season ?? (seasons[0]?.number || null))
</script>

<!-- D03a Progress card: together first, then each person, then the watched-together log. -->
<Card.Root role="region" aria-labelledby="progress-heading">
  <Card.Header>
    <Card.Title id="progress-heading">Progress</Card.Title>
    <Card.Description>
      {season !== null && item.mediaType !== "movie" ? `Season ${season} · ` : ""}Updates as you
      watch.
    </Card.Description>
    <Card.Action>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Adjust my place"
        onclick={() => (adjusting = true)}
      >
        <Pencil />
      </Button>
    </Card.Action>
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    {#if together}
      <p
        class="flex h-8 items-center gap-item rounded-sm bg-secondary px-related type-label-sm text-primary"
      >
        <Users class="size-4" aria-hidden="true" /><span class="flex-1">Together</span>{together}
      </p>
    {/if}
    <ul class="flex flex-col" aria-label="Everyone's place">
      {#each rows as row (row.userId)}<MemberProgressRow {row} />{/each}
    </ul>
    <Separator />
    <SessionLog {item} {members} {authors} {version} onLogged={onChanged} />
  </Card.Content>
</Card.Root>

<DialogShell bind:open={adjusting} title="Adjust my place" description="Only you change this.">
  <ProgressForm
    itemId={item.id}
    episodic={item.mediaType !== "movie"}
    {mine}
    onSaved={() => {
      adjusting = false
      onChanged()
    }}
  />
</DialogShell>
