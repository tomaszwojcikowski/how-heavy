<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import ResultCard from '$lib/components/ResultCard.svelte';
	import WeightKeypad from '$lib/components/WeightKeypad.svelte';
	import { loadCalculatorState, saveTargetState } from '$lib/stores/calculator';
	import type { BarWeight } from '$lib/types/gym';
	import { resolveTargetLoad } from '$lib/utils/calculations';

	const presets = [40, 60, 80, 100, 120, 140];

	let selectedBar: BarWeight = 20;
	let targetValue = '100';
	let hydrated = false;

	onMount(async () => {
		const state = await loadCalculatorState();
		selectedBar = state.target.barWeight;
		targetValue = state.target.value;
		hydrated = true;
	});

	$: parsedTarget = Number.parseFloat(targetValue.replace(',', '.'));
	$: result = resolveTargetLoad(selectedBar, parsedTarget);
	$: if (browser && hydrated) {
		void saveTargetState({
			barWeight: selectedBar,
			value: targetValue
		});
	}
</script>

<svelte:head>
	<title>How Heavy | Target</title>
</svelte:head>

<section class="calculator-shell">
	<div class="target-layout">
		<!-- Result card is DOM-first → on mobile it appears at top above controls.
		     On desktop the 2-col CSS puts .control-card on the left via order:-1. -->
		<ResultCard {result} />

		<section class="control-card">
			<BarSelector bind:value={selectedBar} onChange={(nextValue) => (selectedBar = nextValue)} />

			<WeightKeypad
				value={targetValue}
				presets={presets}
				helper="Common targets are one tap away. Decimal values are supported."
				onValueChange={(nextValue) => (targetValue = nextValue)}
			/>
		</section>
	</div>
</section>

<style>
	.target-layout {
		display: grid;
		gap: 1rem;
	}

	.control-card {
		display: grid;
		gap: 1.25rem;
		padding: 1.2rem;
		background: rgba(255, 250, 245, 0.88);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
	}

	@media (min-width: 62rem) {
		.target-layout {
			grid-template-columns: minmax(20rem, 24rem) minmax(0, 1fr);
			align-items: start;
		}

		/* Controls go in left column visually even though ResultCard is first in DOM */
		.control-card {
			order: -1;
		}
	}
</style>