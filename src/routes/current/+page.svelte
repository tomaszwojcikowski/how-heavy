<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import PlatePicker from '$lib/components/PlatePicker.svelte';
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { loadCalculatorState, saveCurrentState } from '$lib/stores/calculator';
	import type { BarWeight, PlateWeight } from '$lib/types/gym';
	import { calculateCurrentLoad, summarizePlateCounts } from '$lib/utils/calculations';
	import { formatWeight } from '$lib/utils/formatting';

	let selectedBar: BarWeight = 20;
	let oneSidePlates: PlateWeight[] = [];
	let hydrated = false;

	onMount(async () => {
		const state = await loadCalculatorState();
		selectedBar = state.current.barWeight;
		oneSidePlates = state.current.plates;
		hydrated = true;
	});

	$: summary = calculateCurrentLoad(selectedBar, oneSidePlates);
	$: groupedPlates = summarizePlateCounts(oneSidePlates);
	$: if (browser && hydrated) {
		void saveCurrentState({
			barWeight: selectedBar,
			plates: oneSidePlates
		});
	}

	function addPlate(weight: PlateWeight) {
		oneSidePlates = [...oneSidePlates, weight];
	}

	function removePlate(weight: PlateWeight) {
		const plateIndex = oneSidePlates.lastIndexOf(weight);

		if (plateIndex < 0) {
			return;
		}

		oneSidePlates = oneSidePlates.toSpliced(plateIndex, 1);
	}

	function clearAll() {
		oneSidePlates = [];
	}
</script>

<svelte:head>
	<title>How Heavy | Current</title>
</svelte:head>

<section class="calculator-shell">
	<!-- Sticky total strip — always visible as user taps plates -->
	<div class="totals-strip" aria-live="polite" aria-label="Running total">
		<strong class="totals-strip__weight">{formatWeight(summary.totalWeight)}</strong>
		<div class="totals-strip__meta">
			<span>{formatWeight(summary.barWeight)} bar</span>
			<span class="sep">·</span>
			<span>{formatWeight(summary.oneSideWeight)} per side</span>
			<span class="sep">·</span>
			<span>{oneSidePlates.length} plates</span>
		</div>
	</div>

	<!-- Controls: bar selector + plate picker -->
	<section class="control-card">
		<div class="control-header">
			<BarSelector bind:value={selectedBar} onChange={(nextValue) => (selectedBar = nextValue)} label="Active bar" />
			<button type="button" class="clear-btn" onclick={clearAll}>Clear</button>
		</div>

		<PlatePicker selectedPlates={oneSidePlates} onAdd={addPlate} onRemove={removePlate} />
	</section>

	<!-- Barbell visualization — below the fold, scroll to see -->
	<section class="viz-card">
		<PlateStackPreview barWeight={summary.barWeight} plates={groupedPlates} />
	</section>
</section>

<style>
	.calculator-shell {
		display: grid;
		gap: 0.85rem;
	}

	/* Sticky total pill — follows the user as they scroll the plate picker */
	.totals-strip {
		position: sticky;
		top: 0.5rem;
		z-index: 5;
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0.85rem 1.2rem;
		background: rgba(255, 250, 245, 0.92);
		backdrop-filter: blur(20px);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
		flex-wrap: wrap;
	}

	.totals-strip__weight {
		font-family: 'Archivo', sans-serif;
		font-size: clamp(1.8rem, 5vw, 2.4rem);
		line-height: 1;
		color: var(--ink-strong);
	}

	.totals-strip__meta {
		display: flex;
		gap: 0.45rem;
		align-items: center;
		color: var(--ink-soft);
		font-size: 0.88rem;
		flex-wrap: wrap;
	}

	.sep {
		opacity: 0.35;
	}

	.control-card,
	.viz-card {
		display: grid;
		gap: 1.1rem;
		padding: 1.2rem;
		background: rgba(255, 250, 245, 0.88);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
	}

	.control-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.clear-btn {
		flex-shrink: 0;
		border-radius: 999px;
		padding: 0.6rem 1rem;
		font: inherit;
		font-weight: 700;
		border: 1px solid var(--outline);
		background: rgba(255, 255, 255, 0.68);
		cursor: pointer;
		color: var(--ink-strong);
	}

	@media (min-width: 62rem) {
		/* On desktop: controls left, (total + viz) right as a side panel */
		.calculator-shell {
			grid-template-columns: minmax(22rem, 1.2fr) minmax(0, 0.8fr);
			grid-template-rows: auto 1fr;
			align-items: start;
		}

		.totals-strip {
			grid-column: 2;
			grid-row: 1;
		}

		.control-card {
			grid-column: 1;
			grid-row: 1 / 3;
		}

		.viz-card {
			grid-column: 2;
			grid-row: 2;
		}
	}
</style>