<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { DEFAULT_HOME_CARDS, HOME_CARDS, type HomeCardId } from "@/shared/domain"
  import { FormError, FormState, SettingsSection } from "@/shared/ui"
  import type { Space } from "../../domain/space"
  import { useSpaces } from "../context"
  import ModuleRows from "./ModuleRows.svelte"
  import { saveAndRefresh } from "./save"

  let { space }: { space: Space } = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  let cards = $state<HomeCardId[]>(untrack(() => [...space.homeCards]))
  const rows = $derived([...cards, ...HOME_CARDS.filter((id) => !cards.includes(id))])

  async function save(event: SubmitEvent) {
    event.preventDefault()
    await saveAndRefresh(form, store, () => service.profile.saveHomeCards(space.id, cards))
  }
</script>

<!-- Figma D16a Home modules: which cards Home shows, in which order, for everyone. -->
<SettingsSection
  id="settings-home"
  title="Home modules"
  description="Choose what appears on Home and in which order. Drag a handle or use the arrows."
>
  <form class="flex flex-col gap-stack" onsubmit={save} novalidate>
    <p class="self-end type-xs text-muted-foreground">
      {cards.length} of {HOME_CARDS.length} shown
    </p>
    <ModuleRows bind:cards {rows} />
    <FormError message={form.formError} />
    <div class="flex items-center justify-end gap-item border-t border-border pt-stack">
      <Button variant="link" onclick={() => (cards = [...DEFAULT_HOME_CARDS])}>Reset order</Button>
      <Button type="submit" disabled={form.pending}>Save changes</Button>
    </div>
  </form>
</SettingsSection>
