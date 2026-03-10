<script lang="ts">
	import { afterUpdate } from 'svelte';

	export let value = '';
	export let label = 'Target total';
	export let helper = 'Use presets or type a total weight';
	export let presets: number[] = [];
	export let onValueChange: (nextValue: string) => void = () => {};

	let fieldEl: HTMLElement | undefined;

	afterUpdate(() => {
		if (fieldEl) {
			(fieldEl as any).value = value;
		}
	});

	function applyPreset(preset: number) {
		onValueChange(String(preset));
	}

	function adjust(delta: number) {
		const base = Number.parseFloat(value.replace(',', '.'));
		if (!Number.isFinite(base)) return;
		const next = Math.max(0, Number.parseFloat((base + delta).toFixed(2)));
		onValueChange(String(next));
	}

	$: normalizedValue = Number.parseFloat(value.replace(',', '.'));
</script>

<div class="weight-keypad">
	<div class="weight-keypad__input-row">
		<button type="button" class="adj-btn" onclick={() => adjust(-2.5)} aria-label="Decrease by 2.5 kg">
			<span class="material-symbols-rounded" aria-hidden="true">remove</span>
			<span class="adj-btn__label">2.5</span>
		</button>
		<md-outlined-text-field
			bind:this={fieldEl}
			type="text"
			{label}
			suffix-text="kg"
			inputmode="decimal"
			placeholder="100"
			supporting-text={helper}
			oninput={(e: Event) => onValueChange((e.currentTarget as any).value)}
		></md-outlined-text-field>
		<button type="button" class="adj-btn" onclick={() => adjust(2.5)} aria-label="Increase by 2.5 kg">
			<span class="material-symbols-rounded" aria-hidden="true">add</span>
			<span class="adj-btn__label">2.5</span>
		</button>
	</div>

	{#if presets.length > 0}
		<md-chip-set aria-label="Common target presets">
			{#each presets as preset (preset)}
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
				<md-filter-chip
					label="{preset} kg"
					selected={normalizedValue === preset}
					onclick={() => applyPreset(preset)}
				></md-filter-chip>
			{/each}
		</md-chip-set>
	{/if}
</div>

<style>
	.weight-keypad {
		display: grid;
		gap: 0.85rem;
	}

	.weight-keypad__input-row {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
	}

	.weight-keypad__input-row md-outlined-text-field {
		flex: 1;
		min-width: 0;
	}

	.adj-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		padding: 0.5rem 0.7rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--outline);
		background: var(--md-sys-color-surface-container-lowest);
		color: var(--text-primary);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.12s ease, color 0.12s ease;
		font-variant-numeric: tabular-nums;
	}

	.adj-btn:hover {
		background: var(--surface-2);
	}

	.adj-btn:active {
		background: var(--surface-3);
	}

	.adj-btn .material-symbols-rounded {
		font-size: 1.15rem;
		font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
	}

	.adj-btn__label {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.01em;
		color: var(--text-secondary);
		line-height: 1;
	}

	md-chip-set {
		flex-wrap: wrap;
	}
</style>