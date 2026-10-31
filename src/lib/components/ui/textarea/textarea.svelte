<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		"data-slot": dataSlot = "textarea",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"bg-card border-border focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive disabled:bg-muted disabled:text-muted-foreground rounded-md border px-3 py-2.5 type-sm transition-colors focus-visible:ring-3 aria-invalid:ring-3 flex field-sizing-content min-h-24 w-full outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
		className
	)}
	bind:value
	{...restProps}></textarea>
