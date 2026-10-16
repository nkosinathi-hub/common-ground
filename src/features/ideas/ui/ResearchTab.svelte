<script lang="ts">
  import type { Snippet } from "svelte"
  import type { Viewer } from "@/shared/domain"
  import type { Idea } from "../domain"
  import HypothesesPanel from "./HypothesesPanel.svelte"
  import LinksPanel from "./LinksPanel.svelte"
  import NotesPanel from "./NotesPanel.svelte"

  interface Props {
    idea: Idea
    viewer: Viewer
    attachments?: Snippet<[Idea]>
  }

  let { idea, viewer, attachments }: Props = $props()
</script>

<div class="grid gap-6 lg:grid-cols-2">
  <NotesPanel {idea} {viewer} />
  <div class="flex flex-col gap-6">
    <LinksPanel {idea} {viewer} />
    <HypothesesPanel {idea} {viewer} />
    {@render attachments?.(idea)}
  </div>
</div>
