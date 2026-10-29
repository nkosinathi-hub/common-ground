<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLSelectAttributes } from "svelte/elements";

	type NativeSelectProps = Omit<WithElementRef<HTMLSelectAttributes, HTMLSelectElement>, "size"> & {
		size?: "sm" | "default";
	};

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size = "default",
		children,
		...restProps
	}: NativeSelectProps = $props();
</script>

<!-- Local change: styled to the Figma Select (199:2440); the native picker stays on phones. -->
<div
	class={cn(
		"group/native-select relative w-fit",
		className
	)}
	data-slot="native-select-wrapper"
	data-size={size}
>
	<select
		bind:value
		bind:this={ref}
		data-slot="native-select"
		data-size={size}
		class="bg-card border-border text-foreground focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive disabled:bg-muted disabled:text-muted-foreground h-control-default pointer-coarse:h-control-touch w-full min-w-0 appearance-none rounded-md border py-1 pr-9 pl-3 type-sm transition-colors select-none focus-visible:ring-3 aria-invalid:ring-3 data-[size=sm]:h-control-inline data-[size=sm]:pr-8 data-[size=sm]:pl-2.5 outline-none disabled:pointer-events-none disabled:cursor-not-allowed"
		{...restProps}
	>
		{@render children?.()}
	</select>
	<ChevronDownIcon class="text-muted-foreground top-1/2 right-3 size-4 -translate-y-1/2 pointer-events-none absolute select-none" aria-hidden data-slot="native-select-icon" />
</div>
