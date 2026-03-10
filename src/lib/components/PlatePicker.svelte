<script lang="ts">
	import { scale } from 'svelte/transition';

	import PlateGraphic from '$lib/components/PlateGraphic.svelte';
	import type { PlateWeight } from '$lib/types/gym';
	import { PLATE_DEFINITIONS } from '$lib/utils/plates';
	import { summarizePlateCounts } from '$lib/utils/calculations';

	export let selectedPlates: PlateWeight[] = [];
	export let onAdd: (weight: PlateWeight) => void = () => {};
	export let onRemove: (weight: PlateWeight) => void = () => {};

	$: selectedCounts = summarizePlateCounts(selectedPlates);

	function graphicSize(weight: PlateWeight): number {
		return weight >= 5 ? 96 : 78;
	}
</script>

<div class="plate-picker">
	<div class="plate-picker__tray">
		{#each PLATE_DEFINITIONS as plate (plate.weight)}
			<button type="button" class="plate-choice" onclick={() => onAdd(plate.weight)}>
				<PlateGraphic weight={plate.weight} size={graphicSize(plate.weight)} count={selectedCounts.find((item) => item.weight === plate.weight)?.count ?? 0} />
				<span>Add {plate.weight} kg</span>
			</button>
		{/each}
	</div>

	{#if selectedCounts.length > 0}
		<div class="plate-picker__selected">
			{#each selectedCounts as plate (plate.weight)}
				<button type="button" class="selected-pill" onclick={() => onRemove(plate.weight)} in:scale={{ duration: 160, start: 0.85 }} out:scale={{ duration: 120, start: 0.9 }}>
					<span>{plate.weight} kg</span>
					<strong>x{plate.count}</strong>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.plate-picker {
		display: grid;
		gap: 1rem;
	}

	.plate-picker__tray {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7.25rem, 1fr));
		gap: 0.9rem;
	}

	.plate-choice {
		display: grid;
		gap: 0.65rem;
		justify-items: center;
		padding: 0.9rem 0.75rem;
		border-radius: 1.5rem;
		border: 1px solid var(--outline);
		background: rgba(255, 255, 255, 0.7);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.plate-choice span {
		font-size: 0.88rem;
		color: var(--ink-soft);
	}

	.plate-picker__selected {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
	}

	.selected-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.7rem 0.9rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 111, 60, 0.24);
		background: rgba(255, 111, 60, 0.1);
		font: inherit;
		color: var(--ink-strong);
		cursor: pointer;
	}

	.selected-pill strong {
		font-family: 'Archivo', sans-serif;
	}
</style>