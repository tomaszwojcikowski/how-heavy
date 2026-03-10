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
			{@const count = selectedCounts.find((item) => item.weight === plate.weight)?.count ?? 0}
			<div class="plate-choice">
				<PlateGraphic weight={plate.weight} size={graphicSize(plate.weight)} count={count} />
				<div class="plate-choice__meta">
					<span>{plate.weight} kg</span>
					<small>{count} on the bar</small>
				</div>
				<div class="plate-choice__actions">
					<button
						type="button"
						class="plate-choice__action plate-choice__action--remove"
						onclick={() => onRemove(plate.weight)}
						disabled={count === 0}
						aria-label={`Remove ${plate.weight} kilogram plate`}
					>
						<span class="material-symbols-rounded" aria-hidden="true">remove</span>
					</button>
					<button
						type="button"
						class="plate-choice__action plate-choice__action--add"
						onclick={() => onAdd(plate.weight)}
						aria-label={`Add ${plate.weight} kilogram plate`}
					>
						<span class="material-symbols-rounded" aria-hidden="true">add</span>
					</button>
				</div>
			</div>
		{/each}
	</div>

	{#if selectedCounts.length > 0}
		<div class="plate-picker__selected">
			<md-chip-set>
				{#each selectedCounts as plate (plate.weight)}
					<md-input-chip
						label="{plate.weight} kg × {plate.count}"
						onremove={() => onRemove(plate.weight)}
						in:scale={{ duration: 160, start: 0.85 }}
						out:scale={{ duration: 120, start: 0.9 }}
					></md-input-chip>
				{/each}
			</md-chip-set>
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
		gap: 0.75rem;
		justify-items: center;
		padding: 0.9rem 0.75rem;
		border-radius: 10px;
		border: 1px solid var(--outline);
		background: var(--surface-4);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
	}

	.plate-choice__meta {
		display: grid;
		gap: 0.15rem;
		justify-items: center;
	}

	.plate-choice__meta span {
		font-weight: 700;
		font-size: 0.88rem;
		color: var(--ink-strong);
	}

	.plate-choice__meta small {
		color: var(--ink-muted);
		font-size: 0.78rem;
	}

	.plate-choice__actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.55rem;
		width: 100%;
	}

	.plate-choice__action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.5rem;
		border-radius: 8px;
		border: 1px solid var(--outline);
		background: var(--surface-2);
		color: var(--ink-soft);
		cursor: pointer;
	}

	.plate-choice__action .material-symbols-rounded {
		font-size: 1.2rem;
		line-height: 1;
	}

	.plate-choice__action--add {
		background: rgba(255, 111, 60, 0.18);
		border-color: rgba(255, 111, 60, 0.36);
		color: #8a3517;
	}

	.plate-choice__action--remove {
		background: rgba(53, 89, 224, 0.14);
		border-color: rgba(53, 89, 224, 0.28);
		color: #2842a5;
	}

	.plate-choice__action:disabled {
		background: rgba(95, 67, 60, 0.08);
		border-color: rgba(95, 67, 60, 0.14);
		color: var(--ink-faint);
		opacity: 0.72;
		cursor: not-allowed;
	}

	.plate-picker__selected {
		display: block;
	}
</style>