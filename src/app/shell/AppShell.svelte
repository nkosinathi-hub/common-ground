<script lang="ts">
  import type { Snippet } from "svelte"
  import AccountMenu from "./AccountMenu.svelte"
  import BottomNav from "./BottomNav.svelte"
  import NavRail from "./NavRail.svelte"
  import type { Section } from "./nav"
  import SpaceSwitcher from "./SpaceSwitcher.svelte"

  let {
    spaceId,
    current,
    theme,
    onSignOut,
    actions,
    children,
  }: {
    spaceId: string
    current: Section | null
    theme: string
    onSignOut: () => void
    actions?: Snippet
    children: Snippet
  } = $props()

  // Theme applies only inside a space; leaving the shell restores the neutral palette.
  $effect(() => {
    document.documentElement.dataset.spaceTheme = theme
    return () => delete document.documentElement.dataset.spaceTheme
  })
  /** The router reads every hash as a route, so the skip link moves focus itself. */
  function skipToMain(event: MouseEvent) {
    event.preventDefault()
    document.getElementById("main")?.focus()
  }
</script>

<a
  href="#main"
  onclick={skipToMain}
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:p-2"
>
  Skip to content
</a>
<div class="flex min-h-dvh">
  <NavRail {spaceId} {current}>
    {#snippet top()}<SpaceSwitcher />{/snippet}
    {#snippet bottom()}<AccountMenu {onSignOut} />{/snippet}
  </NavRail>
  <div class="flex min-w-0 flex-1 flex-col">
    <header class="flex items-center gap-2 border-b px-4 py-2 md:justify-end md:border-none">
      <div class="min-w-0 flex-1 md:hidden"><SpaceSwitcher /></div>
      {@render actions?.()}
      <div class="md:hidden"><AccountMenu {onSignOut} /></div>
    </header>
    <main
      id="main"
      tabindex="-1"
      class="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-24 md:px-8 md:pb-10"
    >
      {@render children()}
    </main>
  </div>
</div>
<BottomNav {spaceId} {current} />
