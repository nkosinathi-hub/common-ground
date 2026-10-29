<script lang="ts">
  import { untrack } from "svelte"
  import { CircleAlert, Check } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { fromHsv, normaliseHex, parseHex, toHex, toHsv } from "../../domain/color"
  import { checkPick, type PickKind } from "../../domain/pick-check"
  import type { SpaceLook } from "../../domain/space-look"
  import ColourArea from "./ColourArea.svelte"
  import { recentColours, rememberColour } from "./recent-colours"

  interface Props {
    kind: PickKind
    look: SpaceLook
    start: string
    onpick: (hex: string) => void
  }

  let { kind, look, start, onpick }: Props = $props()
  let hsv = $state(untrack(() => toHsv(parseHex(start)!)))
  let typed = $state(untrack(() => start))
  const hex = $derived(normaliseHex(typed) ?? toHex(fromHsv(hsv)))
  const check = $derived(checkPick(kind, hex, look))
  const recent = recentColours()

  function set(next: string) {
    typed = next
    const rgb = parseHex(next)
    if (rgb) hsv = toHsv(rgb)
  }
  function use(colour: string) {
    rememberColour(colour)
    onpick(colour)
  }
</script>

<!-- Figma Colour picker (239:8487): area, hue, hex, recent colours and a contrast line. -->
<div class="flex flex-col gap-item p-inset">
  <ColourArea bind:hsv={() => hsv, (next) => ((hsv = next), (typed = toHex(fromHsv(next))))} />
  <div class="flex items-center gap-related">
    <span class="size-8 shrink-0 rounded-md border border-border" style:background={hex}></span>
    <Input
      aria-label="Hex colour"
      class="w-field-hex"
      value={typed}
      oninput={(e) => set(e.currentTarget.value)}
    />
  </div>
  {#if recent.length}
    <div class="flex flex-wrap gap-related" role="group" aria-label="Recent colours">
      {#each recent as colour (colour)}
        <button
          type="button"
          class="size-6 rounded-full border border-border"
          style:background={colour}
          aria-label={colour}
          onclick={() => set(colour)}
        ></button>
      {/each}
    </div>
  {/if}
  {#if check}
    <p
      class="flex items-center gap-related type-sm {check.passes
        ? 'text-foreground'
        : 'text-destructive'}"
      aria-live="polite"
    >
      {#if check.passes}<Check class="size-4" aria-hidden="true" />Readable, {check.ratio}:1
      {:else}<CircleAlert class="size-4" aria-hidden="true" />Hard to read, {check.ratio}:1{/if}
    </p>
    {#if check.fix}
      <Button variant="outline" size="sm" onclick={() => set(check.fix!.hex)}
        >Use {check.fix.hex.toUpperCase()} ({check.fix.ratio}:1)</Button
      >
    {/if}
  {/if}
  <Button disabled={!check?.passes} onclick={() => use(hex)}>Use colour</Button>
</div>
