<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { FormState } from "@/shared/ui"
  import type { Space } from "../../domain/space"
  import { useSpaces } from "../context"
  import ChoiceGroup from "./ChoiceGroup.svelte"
  import { saveAndRefresh } from "./save"

  let { space }: { space: Space } = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  let intent = $state<string>(untrack(() => space.defaultWatchIntent))
  let weekStart = $state<string>(untrack(() => String(space.weekStartsOn)))
  const INTENTS = [
    ["want_to_watch", "Want to watch"],
    ["watch_together", "Watch together"],
  ] as const
  const WEEK_STARTS = [
    ["1", "Monday"],
    ["0", "Sunday"],
  ] as const

  async function save(event: SubmitEvent) {
    event.preventDefault()
    const fields = {
      defaultWatchIntent: intent === "watch_together" ? "watch_together" : "want_to_watch",
      weekStartsOn: weekStart === "0" ? 0 : 1,
    } as const
    await saveAndRefresh(form, store, () => service.profile.savePreferences(space.id, fields))
  }
</script>

<Card.Root id="settings-preferences" tabindex={-1}>
  <Card.Header><Card.Title>Preferences</Card.Title></Card.Header>
  <Card.Content>
    <form class="grid gap-4" onsubmit={save} novalidate>
      <ChoiceGroup
        id="pref-intent"
        label="New watchlist titles start in"
        options={INTENTS}
        bind:value={intent}
      />
      <ChoiceGroup
        id="pref-week"
        label="Weeks start on"
        options={WEEK_STARTS}
        bind:value={weekStart}
      />
      {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
      <Button type="submit" class="w-fit" disabled={form.pending}>Save preferences</Button>
    </form>
  </Card.Content>
</Card.Root>
