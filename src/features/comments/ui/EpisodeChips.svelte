<script lang="ts">
  import { Chip } from "@/shared/ui"

  interface Props {
    count: number
    /** The chosen episode; null is All. */
    value: number | null
    onchange: (episode: number | null) => void
  }

  let { count, value, onchange }: Props = $props()
  const options = $derived([null, ...Array.from({ length: count }, (_, i) => i + 1)])
</script>

<!-- Episode filter chips: All, then each episode of your season; yours is chosen first. -->
<div class="flex gap-related overflow-x-auto" role="group" aria-label="Episode">
  {#each options as option (option ?? 0)}
    <Chip class="shrink-0" selected={value === option} onclick={() => onchange(option)}
      >{option === null ? "All" : `E${option}`}</Chip
    >
  {/each}
</div>
