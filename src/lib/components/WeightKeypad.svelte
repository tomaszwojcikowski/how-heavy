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

	$: normalizedValue = Number.parseFloat(value.replace(',', '.'));
</script>

<div class="weight-keypad">
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

	md-outlined-text-field {
		width: 100%;
	}

	md-chip-set {
		flex-wrap: wrap;
	}
</style>