<script lang="ts">
  import { BellRing, Play } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { Button } from "$lib/components/ui/button"
  import { TitleSummary, type SummaryTitle } from "@/features/catalog"
  import { DialogShell, FormError, FormState, navigate, ViewToggle } from "@/shared/ui"
  import type { PartySource } from "../domain/party"
  import { useParties } from "./context"
  import EpisodeRangeFields from "./EpisodeRangeFields.svelte"
  import { StartFormState } from "./start-form-state.svelte"

  interface Props {
    open: boolean
    spaceId: string
    itemId: string
    isFilm: boolean
    title?: SummaryTitle
  }

  let { open = $bindable(false), spaceId, itemId, isFilm, title }: Props = $props()
  const { service } = useParties()
  const fields = new StartFormState()
  const submission = new FormState()
  const SOURCES: { value: PartySource; label: string; hint: string }[] = [
    {
      value: "jellyfin",
      label: "In the app",
      hint: "Play it here; everyone's player keeps in step.",
    },
    {
      value: "external",
      label: "Elsewhere",
      hint: "On a TV or in another app. Common Ground keeps your episode range in step; it doesn't play or sync the video.",
    },
    {
      value: "netflix",
      label: "Netflix",
      hint: "On Netflix, with the Common Ground extension keeping everyone in step.",
    },
  ]
  const hint = $derived(SOURCES.find((s) => s.value === fields.source)?.hint)
  const next = $derived(
    isFilm ? title?.meta : `Up next: S${fields.fromSeason} E${fields.fromEpisode}`,
  )

  $effect(() => {
    if (open && !isFilm) void service.defaultRange(itemId).then((range) => fields.reset(range))
  })

  async function submit() {
    const started = await submission.run(() => service.start(fields.toInput(itemId, isFilm)))
    if (!started.ok) return
    open = false
    navigate({ name: "party", spaceId, partyId: started.value })
  }
</script>

<!-- Figma S05: the title, where you are watching, the episodes, then start. -->
<DialogShell
  bind:open
  wide
  title="Watch together"
  description="Set up a shared watch. Nothing starts until you're ready."
  busy={submission.pending}
  onsubmit={submit}
>
  {#if title}<TitleSummary title={{ ...title, meta: next }} />{/if}
  <div class="flex flex-col gap-related">
    <span class="type-label text-foreground">Where are you watching?</span>
    <ViewToggle
      label="Where are you watching?"
      class="w-full! [&>*]:flex-1"
      value={fields.source}
      options={SOURCES}
      onchange={(v) => (fields.source = v)}
    />
    <p class="type-sm text-muted-foreground">{hint}</p>
  </div>
  {#if !isFilm}
    <EpisodeRangeFields {fields} />
    <FormError message={submission.fieldError("range")} alert={false} />
  {/if}
  <Alert.Root role="note">
    <BellRing aria-hidden="true" />
    <Alert.Description>
      Everyone in the space hears that you started. Shared progress moves once everyone has watched;
      your own progress stays separate.
    </Alert.Description>
  </Alert.Root>
  <FormError message={submission.formError} />
  {#snippet footer()}
    <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
    <Button type="submit" disabled={submission.pending}
      ><Play aria-hidden="true" />Start watching</Button
    >
  {/snippet}
</DialogShell>
