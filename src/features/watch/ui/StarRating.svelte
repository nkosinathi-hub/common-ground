<script lang="ts">
  import { Star } from "@lucide/svelte"
  import { cn } from "$lib/utils"
  import { ratingLabel } from "../domain/rating"
  import { RATING_MAX } from "../domain/validation"

  interface Props {
    value: number | null
    /** Choosing the current rating again clears it. */
    onchange: (rating: number | null) => void
    disabled?: boolean
  }

  let { value, onchange, disabled = false }: Props = $props()
  const stars = Array.from({ length: RATING_MAX }, (_, index) => index + 1)
</script>

<!-- D03a "Your rating": five stars beside the List, saved as soon as one is chosen. -->
<fieldset class="flex flex-col gap-related" {disabled}>
  <legend class="mb-related type-label text-foreground">Your rating</legend>
  <div class="flex h-control-default items-center gap-hairline">
    {#each stars as star (star)}
      {@const filled = value !== null && star <= value}
      <button
        type="button"
        class="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-50"
        aria-label="Rate {ratingLabel(star)}"
        aria-pressed={value === star}
        onclick={() => onchange(value === star ? null : star)}
      >
        <Star
          class={cn("size-5", filled ? "fill-primary text-primary" : "text-foreground")}
          aria-hidden="true"
        />
      </button>
    {/each}
    <span class="ml-hairline type-sm text-muted-foreground">{ratingLabel(value)}</span>
  </div>
</fieldset>
