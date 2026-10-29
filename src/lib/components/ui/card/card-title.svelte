<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// Local change: renders a real heading (h2 by default, `level` to override) for accessibility.
	let {
		ref = $bindable(null),
		class: className,
		level = 2,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>> & { level?: 1 | 2 | 3 } = $props();
</script>

<svelte:element
	this={`h${level}`}
	bind:this={ref}
	data-slot="card-title"
	class={cn("type-h3 group-data-[size=sm]/card:type-label", className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
