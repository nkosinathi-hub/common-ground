<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { FormField, FormState, toast } from "@/shared/ui"
  import type { Space } from "../domain/space"
  import type { SpaceTemplateId } from "../domain/templates"
  import { useSpaces } from "./context"
  import DangerZone from "./DangerZone.svelte"
  import InvitesCard from "./InvitesCard.svelte"
  import MembersCard from "./MembersCard.svelte"
  import TemplatePicker from "./TemplatePicker.svelte"

  interface Props {
    space: Space
    /** The signed-in user's id, so their own row is marked and cannot be removed. */
    me: string
  }

  let { space, me }: Props = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  let name = $state(untrack(() => space.name))
  let template = $state<SpaceTemplateId>(untrack(() => space.template))

  async function save(event: SubmitEvent) {
    event.preventDefault()
    if (
      (await form.run(() => service.profile.saveGeneral(space.id, { ...space, name, template }))).ok
    ) {
      toast.success("Saved")
      await store.refresh()
    }
  }
</script>

<div class="grid gap-6">
  <h1 class="text-2xl font-semibold">Space settings</h1>
  {#if space.role === "owner"}
    <Card.Root>
      <Card.Header><Card.Title>Name and feel</Card.Title></Card.Header>
      <Card.Content>
        <form class="grid gap-4" onsubmit={save} novalidate>
          <FormField
            id="space-name"
            label="Name"
            bind:value={name}
            error={form.fieldError("name")}
          />
          <TemplatePicker bind:value={template} />
          {#if form.formError}<p role="alert" class="text-sm text-destructive">
              {form.formError}
            </p>{/if}
          <Button type="submit" class="w-fit" disabled={form.pending}>Save</Button>
        </form>
      </Card.Content>
    </Card.Root>
    <InvitesCard {space} />
  {/if}
  <MembersCard {space} {me} />
  <DangerZone {space} />
</div>
