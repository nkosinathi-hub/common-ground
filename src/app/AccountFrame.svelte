<script lang="ts">
  import type { Snippet } from "svelte"
  import { useSpaces } from "@/features/spaces"
  import type { Route } from "@/shared/domain"
  import AppShell from "./shell/AppShell.svelte"
  import CaptureDialog from "./shell/CaptureDialog.svelte"

  interface Props {
    route: Route
    signOut: () => void
    /** The page, told whether the shell frames it. */
    children: Snippet<[boolean]>
  }

  let { route, signOut, children }: Props = $props()
  const { store } = useSpaces()
  // Account pages belong to the person, not a space; the shell shows the space they were in.
  const space = $derived(store.active ?? store.spaces[0])
</script>

{#if space}
  <AppShell {space} {route} onSignOut={signOut}>
    {@render children(true)}
  </AppShell>
  <CaptureDialog spaceId={space.id} />
{:else}
  {@render children(false)}
{/if}
