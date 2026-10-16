<script lang="ts">
  import { MODES, type NoteKind } from "../domain"

  interface Props {
    mode: NoteKind
    onChange: (mode: NoteKind) => void
  }

  let { mode, onChange }: Props = $props()
  const buttons: HTMLButtonElement[] = []

  /** Arrow keys move between the two choices, as in any radio group. */
  function key(event: KeyboardEvent, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = (index + step + MODES.length) % MODES.length
    onChange(MODES[next]!.value)
    buttons[next]?.focus()
  }
</script>

<div
  role="radiogroup"
  aria-label="Kind of note"
  class="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
>
  {#each MODES as choice, index (choice.value)}
    {@const checked = choice.value === mode}
    <button
      bind:this={buttons[index]}
      type="button"
      role="radio"
      aria-checked={checked}
      tabindex={checked ? 0 : -1}
      class="min-h-11 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none {checked
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'}"
      onclick={() => onChange(choice.value)}
      onkeydown={(event) => key(event, index)}>{choice.label}</button
    >
  {/each}
</div>
