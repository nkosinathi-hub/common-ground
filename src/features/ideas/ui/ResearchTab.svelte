<script lang="ts">
  import type { Snippet } from "svelte"
  import type { Idea } from "../domain"
  import HypothesesPanel from "./HypothesesPanel.svelte"
  import LinksPanel from "./LinksPanel.svelte"
  import NotesPanel from "./NotesPanel.svelte"

  interface Props {
    idea: Idea
    attachments?: Snippet<[Idea]>
  }

  let { idea, attachments }: Props = $props()
</script>

<div class="grid gap-6 lg:grid-cols-2">
  <NotesPanel {idea} />
  <div class="flex flex-col gap-6">
    <LinksPanel {idea} />
    <HypothesesPanel {idea} />
    {@render attachments?.(idea)}
  </div>
</div>
