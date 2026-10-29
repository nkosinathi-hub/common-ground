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
    /** Read as one image, e.g. "On this idea: Ana, Ben"; leave out when the names are written beside it. */
    label?: string
    max?: number
    size?: "sm" | "default" | "lg"
  }

  let { people, label, max = 3, size = "default" }: Props = $props()
  const extra = $derived(people.length - max)
</script>

{#if people.length > 0}
  <AvatarGroup
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : "true"}
  >
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
