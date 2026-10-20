<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { FEELING_WORDS, insertWord } from "../domain"
  import { remembered } from "./remembered"

  interface Props {
    value: string
    /** The "How I feel" box, for its cursor. */
    target: HTMLTextAreaElement | null
  }

  let { value = $bindable(""), target }: Props = $props()
  const memory = remembered("notes.feelingWords")
  let open = $state(memory.get())
  const id = "feeling-words"

  function toggle() {
    open = !open
    memory.set(open)
  }

  /** Inserts at the cursor and keeps the cursor after the word, so words can be stacked. */
  function pick(word: string) {
    const at = target?.selectionStart ?? value.length
    const next = insertWord(value, word, at)
    value = next.text
    queueMicrotask(() => target?.setSelectionRange(next.cursor, next.cursor))
  }
</script>

<div class="grid gap-2">
  <Button
    variant="link"
    size="sm"
    class="min-h-11 justify-self-start px-0"
    aria-expanded={open}
    aria-controls={id}
    onclick={toggle}>Need a word?</Button
  >
  <ul {id} class="flex flex-wrap gap-1.5" aria-label="Feeling words" hidden={!open}>
    {#each FEELING_WORDS as word (word)}
      <li>
        <Button size="sm" variant="outline" class="min-h-11 rounded-full" onclick={() => pick(word)}
          >{word}</Button
        >
      </li>
    {/each}
  </ul>
</div>
