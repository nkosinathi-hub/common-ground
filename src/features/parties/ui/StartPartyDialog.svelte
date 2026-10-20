<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { FormError, FormState, navigate } from "@/shared/ui"
  import { useParties } from "./context"
  import EpisodeRangeFields from "./EpisodeRangeFields.svelte"
  import { StartFormState } from "./start-form-state.svelte"

  interface Props {
    open: boolean
    spaceId: string
    itemId: string
    isFilm: boolean
  }

  let { open = $bindable(false), spaceId, itemId, isFilm }: Props = $props()
  const { service } = useParties()
  const fields = new StartFormState()
  const submission = new FormState()
  const SOURCES = [
    { value: "jellyfin", label: "In the app" },
    { value: "external", label: "Somewhere else (a TV, another app)" },
  ] as const

  $effect(() => {
    if (open && !isFilm) void service.defaultRange(itemId).then((range) => fields.reset(range))
  })

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const started = await submission.run(() => service.start(fields.toInput(itemId, isFilm)))
    if (!started.ok) return
    open = false
    navigate({ name: "party", spaceId, partyId: started.value })
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Watch together</Dialog.Title>
      <Dialog.Description>
        Everyone in the space hears that you started. Together progress moves when everyone watched.
      </Dialog.Description>
    </Dialog.Header>
    <form class="grid gap-4" onsubmit={submit} novalidate>
      <fieldset class="grid gap-2">
        <legend class="mb-1 text-sm font-medium">Where you will watch</legend>
        {#each SOURCES as source (source.value)}
          <label class="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="party-source"
              class="size-4 accent-primary"
              value={source.value}
              bind:group={fields.source}
            />
            {source.label}
          </label>
        {/each}
      </fieldset>
      {#if !isFilm}
        <EpisodeRangeFields {fields} />
        <FormError message={submission.fieldError("range")} alert={false} />
      {/if}
      <FormError message={submission.formError} />
      <Dialog.Footer>
        <Button type="button" variant="ghost" onclick={() => (open = false)}>Not now</Button>
        <Button type="submit" disabled={submission.pending}>Start the party</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
