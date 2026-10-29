<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { FormError, FormState, SelectField, SettingsSection } from "@/shared/ui"
  import type { Space } from "../../domain/space"
  import { useSpaces } from "../context"
  import { saveAndRefresh } from "./save"

  interface Props {
    space: Space
  }

  let { space }: Props = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  let intent = $state<string>(untrack(() => space.defaultWatchIntent))
  let weekStart = $state<string>(untrack(() => String(space.weekStartsOn)))
  const INTENTS = [
    { value: "want_to_watch", label: "Want to watch" },
    { value: "watch_together", label: "Watch together" },
  ]
  const WEEK_STARTS = [
    { value: "1", label: "Monday" },
    { value: "0", label: "Sunday" },
  ]

  async function save(event: SubmitEvent) {
    event.preventDefault()
    const fields = {
      defaultWatchIntent: intent === "watch_together" ? "watch_together" : "want_to_watch",
      weekStartsOn: weekStart === "0" ? 0 : 1,
    } as const
    await saveAndRefresh(form, store, () => service.profile.savePreferences(space.id, fields))
  }
</script>

<!-- Figma D16b Space preferences: the default Watch list and the first day of the week. -->
<SettingsSection
  id="settings-preferences"
  title="Space preferences"
  description="These apply to everyone in {space.name}."
>
  <form class="flex flex-col gap-stack" onsubmit={save} novalidate>
    <div class="grid gap-stack sm:grid-cols-2">
      <SelectField
        id="pref-intent"
        label="Default Watch list"
        value={intent}
        options={INTENTS}
        onchange={(v) => (intent = v)}
      />
      <SelectField
        id="pref-week"
        label="Week starts on"
        value={weekStart}
        options={WEEK_STARTS}
        onchange={(v) => (weekStart = v)}
      />
    </div>
    <FormError message={form.formError} />
    <div class="flex justify-end border-t border-border pt-stack">
      <Button type="submit" disabled={form.pending}>Save changes</Button>
    </div>
  </form>
</SettingsSection>
