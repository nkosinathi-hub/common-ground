<script lang="ts">
  import type { Snippet } from "svelte"
  import type { MemberRef, Viewer } from "@/shared/domain"
  import type { Idea } from "../domain"
  import HypothesesPanel from "./HypothesesPanel.svelte"
  import LinksPanel from "./LinksPanel.svelte"
  import NotesPanel from "./NotesPanel.svelte"

  interface Props {
    idea: Idea
    viewer: Viewer
    attachments?: Snippet<[Idea]>
    authors?: readonly MemberRef[]
  }

  let { idea, viewer, attachments, authors = [] }: Props = $props()
</script>

<!-- D07: what we found (notes, files) beside where it came from and what we want to test. -->
<div class="grid items-start gap-columns lg:grid-cols-2">
  <div class="flex flex-col gap-stack">
    <NotesPanel {idea} {viewer} {authors} />
    {@render attachments?.(idea)}
  </div>
  <div class="flex flex-col gap-stack">
    <LinksPanel {idea} {viewer} />
    <HypothesesPanel {idea} {viewer} />
  </div>
</div>
