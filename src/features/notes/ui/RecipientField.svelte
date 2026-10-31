<script lang="ts">
  import type { MemberRef } from "@/shared/domain"
  import { SelectField, ViewToggle } from "@/shared/ui"

  interface Props {
    value: string
    members: readonly MemberRef[]
    /** "Something on my mind" goes to one person, never to everyone. */
    direct: boolean
  }

  let { value = $bindable(""), members, direct }: Props = $props()
  const EVERYONE = "everyone"
  // Up to three in the space (S01) the choice is a segmented control; more (S01b) a select.
  const few = $derived(!direct && members.length <= 2)
  const options = $derived([
    ...(direct ? [] : [{ value: EVERYONE, label: "Everyone" }]),
    ...members.map((m) => ({ value: m.id, label: m.displayName })),
  ])
  const choose = (next: string) => (value = next === EVERYONE ? "" : next)
</script>

{#if few}
  <div class="flex flex-col gap-related">
    <span class="type-label text-foreground">To</span>
    <ViewToggle label="To" value={value || EVERYONE} {options} onchange={choose} />
  </div>
{:else}
  <div class="sm:w-field-select sm:shrink-0">
    <SelectField
      id="note-to"
      label="To"
      value={value || (direct ? "" : EVERYONE)}
      options={direct ? [{ value: "", label: "Choose someone" }, ...options] : options}
      onchange={choose}
    />
  </div>
{/if}
