<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"relative inline-flex flex-1 items-center justify-center gap-related whitespace-nowrap type-label text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start",
		"group-data-[variant=default]/tabs-list:h-full group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:px-3 group-data-[variant=default]/tabs-list:data-[state=active]:bg-card group-data-[variant=default]/tabs-list:data-[state=active]:text-primary group-data-[variant=default]/tabs-list:data-[state=active]:shadow-xs",
		"group-data-[variant=line]/tabs-list:h-full group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:data-[state=active]:text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary after:opacity-0 after:transition-opacity group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
		className
	)}
	{...restProps}
/>
