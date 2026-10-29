<script lang="ts">
  import type { Snippet } from "svelte"
  import { buildHash } from "@/shared/domain"
  import Logo from "../Logo.svelte"
  import TextLink from "../TextLink.svelte"

  interface Props {
    /** Beside the card on wide screens (Figma Auth hero, 211:8913); left out on phones. */
    hero?: string
    children: Snippet
  }

  let { hero, children }: Props = $props()
</script>

<!-- Figma Public header (211:8883) over the welcome layout of D19 and D21 to D23. -->
<div class="flex min-h-dvh flex-col bg-background">
  <header class="border-b border-border">
    <div class="mx-auto box-content flex h-18 max-w-public items-center gap-item px-gutter">
      <a href={buildHash({ name: "entry" })} class="flex min-w-0 flex-1 items-center gap-item">
        <Logo size={32} />
        <span class="type-h3 text-foreground">Common Ground</span>
      </a>
      <TextLink href={buildHash({ name: "privacy" })}>Privacy</TextLink>
    </div>
  </header>
  <main
    class="mx-auto box-content flex w-full max-w-public flex-1 items-center justify-center gap-section px-gutter py-section md:py-16 lg:justify-between"
  >
    {#if hero}
      <p class="hidden max-w-100 type-display text-foreground lg:block">{hero}</p>
    {/if}
    {@render children()}
  </main>
</div>
