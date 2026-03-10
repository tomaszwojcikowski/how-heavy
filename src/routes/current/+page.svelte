<script lang="ts">
	import BarSelector from '$lib/components/BarSelector.svelte';
	import PlatePicker from '$lib/components/PlatePicker.svelte';
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import type { BarWeight, PlateWeight } from '$lib/types/gym';
	import { calculateCurrentLoad, summarizePlateCounts } from '$lib/utils/calculations';
	import { formatWeight } from '$lib/utils/formatting';

	let selectedBar: BarWeight = 20;
	let oneSidePlates: PlateWeight[] = [];

	$: summary = calculateCurrentLoad(selectedBar, oneSidePlates);
	$: groupedPlates = summarizePlateCounts(oneSidePlates);

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
	<header class="section-heading">
		<p class="eyebrow">Current mode</p>
		<h2>Measure what is already loaded</h2>
		<p>Tap the plates sitting on one side of the bar. The app mirrors them and calculates the full loaded weight.</p>
	</header>

	<div class="current-layout">
		<section class="control-card">
			<div class="control-card__header">
				<BarSelector bind:value={selectedBar} onChange={(nextValue) => (selectedBar = nextValue)} label="Active bar" />
				<button type="button" class="clear-button" onclick={clearAll}>Clear side</button>
			</div>

			<PlatePicker selectedPlates={oneSidePlates} onAdd={addPlate} onRemove={removePlate} />
		</section>

		<section class="result-card">
			<div class="result-card__header">
				<div>
					<p class="eyebrow">Current load</p>
					<h3>{formatWeight(summary.totalWeight)}</h3>
				</div>
				<span>{oneSidePlates.length} plates on one side</span>
			</div>

			<div class="result-card__metrics">
				<div>
					<small>Bar</small>
					<strong>{formatWeight(summary.barWeight)}</strong>
				</div>
				<div>
					<small>One side</small>
					<strong>{formatWeight(summary.oneSideWeight)}</strong>
				</div>
				<div>
					<small>Total</small>
					<strong>{formatWeight(summary.totalWeight)}</strong>
				</div>
			</div>

			<PlateStackPreview plates={groupedPlates} />
		</section>
	</div>
</section>

<style>
	.current-layout {
		display: grid;
		gap: 1rem;
	}

	.control-card,
	.result-card {
		display: grid;
		gap: 1.1rem;
		padding: 1.2rem;
		background: rgba(255, 250, 245, 0.88);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
	}

	.control-card__header,
	.result-card__header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: start;
	}

	.clear-button,
	span {
		border-radius: 999px;
		padding: 0.7rem 0.95rem;
		font: inherit;
		font-weight: 700;
	}

	.clear-button {
		border: 1px solid var(--outline);
		background: rgba(255, 255, 255, 0.68);
		cursor: pointer;
	}

	h3 {
		margin: 0;
		font-family: 'Archivo', sans-serif;
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		line-height: 0.95;
	}

	span {
		background: rgba(15, 157, 135, 0.14);
		color: #126857;
	}

	.result-card__metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.result-card__metrics div {
		display: grid;
		gap: 0.35rem;
		padding: 0.85rem;
		border-radius: 1.2rem;
		background: rgba(255, 255, 255, 0.72);
		border: 1px solid var(--outline);
	}

	small {
		color: var(--ink-soft);
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	strong {
		font-family: 'Archivo', sans-serif;
	}

	@media (min-width: 62rem) {
		.current-layout {
			grid-template-columns: minmax(22rem, 1.15fr) minmax(0, 0.85fr);
			align-items: start;
		}
	}

	@media (max-width: 44rem) {
		.control-card__header,
		.result-card__header,
		.result-card__metrics {
			grid-template-columns: 1fr;
		}

		.control-card__header,
		.result-card__header {
			display: grid;
		}

		.result-card__metrics {
			display: grid;
		}
	}
</style>