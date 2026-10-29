<script lang="ts">
  import { AvatarGroup, AvatarGroupCount } from "$lib/components/ui/avatar"
  import InitialAvatar from "./InitialAvatar.svelte"

  interface Person {
    readonly name: string
    readonly src?: string | null
    /** True for the signed-in person, drawn in the brand tone. */
    readonly me?: boolean
  }

  interface Props {
    people: readonly Person[]
    /** Read as one image, e.g. "On this idea: Ana, Ben". */
    label: string
    max?: number
    size?: "sm" | "default" | "lg"
  }

  let { people, label, max = 3, size = "default" }: Props = $props()
  const extra = $derived(people.length - max)
</script>

{#if people.length > 0}
  <AvatarGroup role="img" aria-label={label}>
    {#each people.slice(0, max) as person, index (index)}
      <InitialAvatar
        name={person.name}
        src={person.src}
        {size}
        tone={person.me ? "brand" : "secondary"}
        decorative
      />
    {/each}
    {#if extra > 0}<AvatarGroupCount aria-hidden="true">+{extra}</AvatarGroupCount>{/if}
  </AvatarGroup>
{/if}
