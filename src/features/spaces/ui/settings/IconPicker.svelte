<script lang="ts">
  import { cn } from "$lib/utils"
  import { SPACE_ICONS } from "../../domain/profile"
  import { SPACE_ICON_COMPONENTS } from "../icons"

  interface Props {
    value: string | null
  }

  let { value = $bindable(null) }: Props = $props()
  const options = [null, ...SPACE_ICONS]
  const label = (icon: string | null) =>
    icon ? icon.replace(/-\d+$/, "").replace("-", " ") : "Initial letter"
</script>

<fieldset class="grid gap-2">
  <legend class="text-sm font-medium">Icon</legend>
  <div role="radiogroup" aria-label="Icon" class="flex flex-wrap gap-2">
    {#each options as icon (icon ?? "none")}
      {@const Icon = icon ? SPACE_ICON_COMPONENTS[icon] : null}
      <button
        type="button"
        role="radio"
        aria-checked={value === icon}
        aria-label={label(icon)}
        onclick={() => (value = icon)}
        class={cn(
          "grid size-9 place-items-center rounded-md border text-sm",
          value === icon
            ? "border-primary bg-accent ring-2 ring-primary"
            : "hover:border-primary/50",
        )}
      >
        {#if Icon}<Icon class="size-4" aria-hidden="true" />{:else}Aa{/if}
      </button>
    {/each}
  </div>
</fieldset>
