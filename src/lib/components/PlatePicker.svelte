<script lang="ts">
	import { onDestroy } from 'svelte';
	import { scale } from 'svelte/transition';

	import PlateGraphic from '$lib/components/PlateGraphic.svelte';
	import type { PlateWeight } from '$lib/types/gym';
	import { getMaxPlateCountPerSide, PLATE_DEFINITIONS } from '$lib/utils/plates';
	import { summarizePlateCounts } from '$lib/utils/calculations';

	export let selectedPlates: PlateWeight[] = [];
	export let onAdd: (weight: PlateWeight) => void = () => {};
	export let onRemove: (weight: PlateWeight) => void = () => {};

	const plateGroups = [
		{
			key: 'bumper',
			title: 'Bumper plates',
			helper: 'Large work plates closest to the collar.',
			plates: PLATE_DEFINITIONS.filter((plate) => plate.kind === 'bumper')
		},
		{
			key: 'change',
			title: 'Change plates',
			helper: 'Fine-tune the load with smaller jumps.',
			plates: PLATE_DEFINITIONS.filter((plate) => plate.kind === 'change')
		}
	] as const;

	$: selectedCounts = summarizePlateCounts(selectedPlates);

	function graphicSize(weight: PlateWeight): number {
		return weight >= 5 ? 96 : 78;
	}

	let repeatTimeout: ReturnType<typeof setTimeout> | null = null;
	let repeatInterval: ReturnType<typeof setInterval> | null = null;

	function startHold(action: () => void) {
		action();
		repeatTimeout = setTimeout(() => {
			repeatInterval = setInterval(action, 110);
		}, 460);
	}

	function endHold() {
		if (repeatTimeout !== null) {
			clearTimeout(repeatTimeout);
			repeatTimeout = null;
		}
		if (repeatInterval !== null) {
			clearInterval(repeatInterval);
			repeatInterval = null;
		}
	}

	onDestroy(() => {
		endHold();
	});
</script>

<div class="plate-picker">
	{#each plateGroups as group (group.key)}
		<section class="plate-picker__section" data-kind={group.key} aria-label={group.title}>
			<div class="plate-picker__section-copy">
				<div>
					<p class="plate-picker__section-title">{group.title}</p>
					<p class="plate-picker__section-helper">{group.helper}</p>
				</div>
				<span class="plate-picker__section-badge">{group.plates.length} options</span>
			</div>

			<div class="plate-picker__tray">
				{#each group.plates as plate (plate.weight)}
					{@const count = selectedCounts.find((item) => item.weight === plate.weight)?.count ?? 0}
					{@const maxCount = getMaxPlateCountPerSide(plate.weight)}
					{@const atMaxCount = count >= maxCount}
					<div class:plate-choice--change={group.key === 'change'} class="plate-choice">
						<div class="plate-choice__count" aria-live="polite">
							{#if count > 0}
								{count} loaded
							{:else if Number.isFinite(maxCount)}
								{maxCount} / side max
							{:else}
								Tap to load
							{/if}
						</div>
						<strong class="plate-choice__label" aria-label="{plate.weight} kilograms">{plate.weight} <span>kg</span></strong>
						<PlateGraphic weight={plate.weight} size={graphicSize(plate.weight)} count={count} />
						<div class="plate-choice__actions">
							<button
								type="button"
								class="plate-choice__action plate-choice__action--remove"
								onpointerdown={() => count > 0 && startHold(() => onRemove(plate.weight))}
								onpointerup={endHold}
								onpointerleave={endHold}
								onpointercancel={endHold}
								onclick={(e: MouseEvent) => {
									if (e.detail === 0 && count > 0) onRemove(plate.weight);
								}}
								disabled={count === 0}
								aria-label={`Remove ${plate.weight} kilogram plate`}
							>
								<span class="material-symbols-rounded" aria-hidden="true">remove</span>
							</button>
							<button
								type="button"
								class="plate-choice__action plate-choice__action--add"
								onpointerdown={() => !atMaxCount && startHold(() => onAdd(plate.weight))}
								onpointerup={endHold}
								onpointerleave={endHold}
								onpointercancel={endHold}
								onclick={(e: MouseEvent) => {
									if (e.detail === 0 && !atMaxCount) onAdd(plate.weight);
								}}
								disabled={atMaxCount}
								aria-label={`Add ${plate.weight} kilogram plate`}
							>
								<span class="material-symbols-rounded" aria-hidden="true">add</span>
							</button>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}

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

	.plate-picker__section {
		display: grid;
		gap: 0.85rem;
		padding: 0.95rem;
		border-radius: var(--radius-xl);
		border: 1px solid var(--outline);
		background: color-mix(in srgb, var(--surface-4) 82%, white 18%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.44);
	}

	.plate-picker__section[data-kind='bumper'] {
		background: linear-gradient(180deg, color-mix(in srgb, var(--tone-primary-surface) 52%, white 48%), var(--surface-4));
	}

	.plate-picker__section[data-kind='change'] {
		background: linear-gradient(180deg, color-mix(in srgb, var(--tone-secondary-surface) 56%, white 44%), var(--surface-4));
	}

	.plate-picker__section-copy {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: start;
	}

	.plate-picker__section-title {
		margin: 0;
		font-family: 'Archivo', sans-serif;
		font-size: 0.98rem;
		font-weight: 800;
		letter-spacing: var(--tracking-tight);
		color: var(--text-primary);
	}

	.plate-picker__section-helper {
		margin: 0.15rem 0 0;
		font-size: 0.78rem;
		line-height: 1.35;
		color: var(--text-secondary);
	}

	.plate-picker__section-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.28rem 0.6rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 82%, transparent);
		border: 1px solid var(--outline);
		font-size: 0.72rem;
		font-weight: 700;
		white-space: nowrap;
		color: var(--text-secondary);
	}

	.plate-picker__tray {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7.25rem, 1fr));
		gap: 0.9rem;
	}

	.plate-choice {
		display: grid;
		gap: 0.6rem;
		justify-items: center;
		padding: 0.75rem 0.75rem 0.85rem;
		border-radius: 10px;
		border: 1px solid var(--outline);
		background: var(--surface-4);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
		position: relative;
		transition: transform 120ms cubic-bezier(0.2, 0, 0, 1), box-shadow 160ms cubic-bezier(0.2, 0, 0, 1);
	}

	.plate-choice--change {
		background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 84%, var(--tone-secondary-surface) 16%);
	}

	.plate-choice__count {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.18rem 0.42rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 88%, transparent);
		border: 1px solid color-mix(in srgb, var(--outline) 82%, transparent);
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--text-secondary);
	}

	.plate-choice__label {
		font-family: 'Archivo', sans-serif;
		font-size: 1.05rem;
		font-weight: 800;
		letter-spacing: var(--tracking-tight);
		color: var(--text-primary);
		line-height: 1;
		align-self: start;
	}

	.plate-choice__label span {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--text-tertiary);
		vertical-align: 0.1em;
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
		color: var(--text-primary);
		cursor: pointer;
		transition: transform 110ms cubic-bezier(0.2, 0, 0, 1), background 120ms cubic-bezier(0.2, 0, 0, 1), border-color 120ms cubic-bezier(0.2, 0, 0, 1);
	}

	.plate-choice__action:active {
		transform: scale(0.92);
	}

	.plate-choice__action .material-symbols-rounded {
		font-size: 1.2rem;
		line-height: 1;
	}

	.plate-choice__action--add {
		background: var(--tone-primary-surface);
		border-color: var(--tone-primary-border);
		color: var(--tone-primary-text);
	}

	.plate-choice__action--remove {
		background: var(--tone-tertiary-surface);
		border-color: var(--tone-tertiary-border);
		color: var(--tone-tertiary-text);
	}

	.plate-choice__action:disabled {
		background: rgba(95, 67, 60, 0.08);
		border-color: rgba(95, 67, 60, 0.14);
		color: var(--text-tertiary);
		opacity: 0.72;
		cursor: not-allowed;
	}

	.plate-picker__selected {
		display: block;
	}
</style>