<script lang="ts">
  import { Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { LABEL_MAX } from "../domain"

  /** Saves the label; true clears the field for the next item. */
  let { onadd }: { onadd: (label: string) => Promise<boolean> } = $props()
  let label = $state("")
  let adding = $state(false)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if (await onadd(label)) label = ""
  }
</script>

<!-- "Add checklist item" opens a field in place; Enter adds, and the field stays for the next. -->
{#if adding}
  <form class="flex gap-related" onsubmit={submit}>
    <Input
      aria-label="New checklist item"
      placeholder="Add an item"
      maxlength={LABEL_MAX}
      bind:value={label}
      autofocus
      onblur={() => !label.trim() && (adding = false)}
    />
  </form>
{:else}
  <Button variant="ghost" size="sm" class="self-start px-0" onclick={() => (adding = true)}>
    <Plus aria-hidden="true" />Add checklist item
  </Button>
{/if}
