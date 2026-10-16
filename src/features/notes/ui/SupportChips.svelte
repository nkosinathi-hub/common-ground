<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { SUPPORT_WISHES, type SupportWish } from "../domain"

  let { value = $bindable(null) }: { value: SupportWish | null } = $props()

  /** Optional: tapping the chosen chip again clears it. */
  const toggle = (wish: SupportWish) => (value = value === wish ? null : wish)
</script>

<div class="flex flex-wrap gap-1.5" role="group" aria-label="What kind of help">
  {#each SUPPORT_WISHES as wish (wish.value)}
    <Button
      size="sm"
      variant={value === wish.value ? "default" : "outline"}
      class="min-h-11 rounded-full"
      aria-pressed={value === wish.value}
      onclick={() => toggle(wish.value)}>{wish.label}</Button
    >
  {/each}
</div>
