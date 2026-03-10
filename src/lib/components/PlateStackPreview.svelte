<script lang="ts">
	import { scale } from 'svelte/transition';

	import PlateGraphic from '$lib/components/PlateGraphic.svelte';
	import type { PlateCount, PlateWeight } from '$lib/types/gym';
	import { PLATE_MAP } from '$lib/utils/plates';

	export let plates: PlateCount[] = [];

	$: expandedPlates = plates.flatMap((plate) => Array.from({ length: plate.count }, () => plate.weight));

	function graphicSize(weight: PlateWeight): number {
		return Math.max(58, Math.round(PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP].radius * 1.2));
	}
</script>

<div class="stack-shell">
	<div class="stack-bar" aria-hidden="true"></div>

	{#if expandedPlates.length === 0}
		<p>No plates needed. The empty bar already matches.</p>
	{:else}
		<div class="stack-plates" aria-label="Recommended one-side plate stack">
			{#each expandedPlates as weight, index (`${weight}-${index}`)}
				<div class="stack-plate" style={`--stack-offset:${index * -16}px;`} in:scale={{ duration: 180, start: 0.8 }} out:scale={{ duration: 140, start: 0.85 }}>
					<PlateGraphic {weight} size={graphicSize(weight)} stacked={true} />
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.stack-shell {
		display: grid;
		gap: 1rem;
		justify-items: start;
	}

	.stack-bar {
		width: 100%;
		height: 1rem;
		border-radius: 999px;
		background: linear-gradient(90deg, #9a978f, #e5ded6 45%, #8b887f 100%);
		box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5);
	}

	p {
		margin: 0;
		color: var(--ink-soft);
	}

	.stack-plates {
		display: flex;
		align-items: end;
		padding-left: 0.35rem;
		min-height: 8rem;
	}

	.stack-plate {
		margin-left: var(--stack-offset);
	}
</style>