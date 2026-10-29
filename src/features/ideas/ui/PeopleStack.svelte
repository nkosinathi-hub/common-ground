<script lang="ts">
  import { AvatarStack } from "@/shared/ui"

  interface Props {
    /** Display names, author first. */
    names: readonly string[]
  }

  let { names }: Props = $props()
</script>

<AvatarStack
  people={names.map((name) => ({ name }))}
  label="On this idea: {names.join(', ')}"
  size="sm"
/>
