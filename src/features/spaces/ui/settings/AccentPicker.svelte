<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { normaliseHex } from "../../domain/color"
  import { accentTokens, type ColourMode } from "../../domain/contrast"

  interface Props {
    /** Lowercase #rrggbb, or null for the preset's own accent. */
    value: string | null
    mode: ColourMode
  }

  let { value = $bindable(null), mode }: Props = $props()
  let draft = $state(untrack(() => value ?? ""))
  const shown = $derived(value ? accentTokens(value, mode) : null)
  const invalid = $derived(draft !== "" && normaliseHex(draft) === null)

  function typed(raw: string) {
    draft = raw
    const hex = normaliseHex(raw)
    if (hex) value = hex
  }

  function reset() {
    value = null
    draft = ""
  }
</script>

<fieldset class="grid gap-2">
  <legend class="text-sm font-medium">Custom accent</legend>
  <div class="flex flex-wrap items-center gap-2">
    <input
      type="color"
      aria-label="Pick an accent colour"
      class="h-9 w-12 cursor-pointer rounded-md border bg-background p-1"
      value={value ?? "#526b4a"}
      oninput={(event) => typed(event.currentTarget.value)}
    />
    <Label for="accent-hex" class="sr-only">Accent hex code</Label>
    <Input
      id="accent-hex"
      class="w-32 font-mono"
      placeholder="#8a4f5d"
      value={draft}
      oninput={(event) => typed(event.currentTarget.value)}
      aria-invalid={invalid ? true : undefined}
      aria-describedby="accent-note"
    />
    <Button type="button" variant="outline" size="sm" disabled={!value} onclick={reset}>
      Reset
    </Button>
  </div>
  <p id="accent-note" class="text-xs text-muted-foreground" aria-live="polite">
    {#if invalid}Use a colour like #8a4f5d.
    {:else if shown?.adjusted}Adjusted for readability: shown as {shown.vars["--primary"]}.
    {:else if value}Text on this accent stays readable.
    {:else}No custom accent: the colours above apply.{/if}
  </p>
</fieldset>
