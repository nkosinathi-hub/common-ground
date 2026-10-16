<script lang="ts">
  import { untrack } from "svelte"
  import { ArrowDown, ArrowUp } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { Switch } from "$lib/components/ui/switch"
  import {
    HOME_CARD_LABELS,
    HOME_CARDS,
    moveCard,
    toggleCard,
    type HomeCardId,
  } from "@/shared/domain"
  import { FormState } from "@/shared/ui"
  import type { Space } from "../../domain/space"
  import { useSpaces } from "../context"
  import { saveAndRefresh } from "./save"

  let { space }: { space: Space } = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  let cards = $state<HomeCardId[]>(untrack(() => [...space.homeCards]))
  const hidden = $derived(HOME_CARDS.filter((id) => !cards.includes(id)))
  const rows = $derived([...cards, ...hidden])

  async function save(event: SubmitEvent) {
    event.preventDefault()
    await saveAndRefresh(form, store, () => service.profile.saveHomeCards(space.id, cards))
  }
</script>

<Card.Root id="settings-home" tabindex={-1}>
  <Card.Header>
    <Card.Title>Home layout</Card.Title>
    <Card.Description>Choose the cards everyone sees on Home, and their order.</Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="grid gap-4" onsubmit={save} novalidate>
      <ul class="grid gap-2">
        {#each rows as id, index (id)}
          {@const label = HOME_CARD_LABELS[id]}
          {@const shown = cards.includes(id)}
          <li class="flex items-center gap-3 rounded-lg border px-3 py-2">
            <Switch
              checked={shown}
              aria-label={`Show ${label}`}
              onCheckedChange={() => (cards = toggleCard(cards, id))}
            />
            <span class={["flex-1 text-sm", !shown && "text-muted-foreground"]}>{label}</span>
            {#if shown}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move ${label} up`}
                disabled={index === 0}
                onclick={() => (cards = moveCard(cards, id, -1))}
              >
                <ArrowUp class="size-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move ${label} down`}
                disabled={index === cards.length - 1}
                onclick={() => (cards = moveCard(cards, id, 1))}
              >
                <ArrowDown class="size-4" aria-hidden="true" />
              </Button>
            {/if}
          </li>
        {/each}
      </ul>
      {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
      <Button type="submit" class="w-fit" disabled={form.pending}>Save layout</Button>
    </form>
  </Card.Content>
</Card.Root>
