<script lang="ts">
  import { RESPONSE_WISHES, type ResponseWish } from "../domain"

  let { value = $bindable("any") }: { value: ResponseWish } = $props()
</script>

<fieldset class="grid gap-1.5">
  <legend class="mb-1.5 text-sm font-medium">How I'd like you to respond</legend>
  {#each RESPONSE_WISHES as wish (wish.value)}
    <label
      class="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm has-checked:border-primary has-checked:bg-highlight"
    >
      <input
        type="radio"
        name="response-wish"
        class="accent-primary"
        value={wish.value}
        bind:group={value}
      />{wish.label}
    </label>
  {/each}
</fieldset>
