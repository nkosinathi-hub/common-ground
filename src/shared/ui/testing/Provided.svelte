<script lang="ts">
  import { untrack, type Component } from "svelte"

  // The harness forwards props as given; each test checks its own component's props.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyComponent = Component<any>

  /** Test harness: runs the provide calls, then renders the component under test inside them. */
  interface Props {
    provide: () => void
    component: AnyComponent
    props?: Record<string, unknown>
  }

  let { provide, component: Inner, props = {} }: Props = $props()
  untrack(() => provide())
</script>

<Inner {...props} />
