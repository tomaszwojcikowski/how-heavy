<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import ResultCard from '$lib/components/ResultCard.svelte';
	import WeightKeypad from '$lib/components/WeightKeypad.svelte';
	import { modeDescriptions, modeLabels } from '$lib/site';
	import { loadCalculatorState, saveTargetState } from '$lib/stores/calculator';
	import type { BarWeight } from '$lib/types/gym';
	import { resolveTargetLoad } from '$lib/utils/calculations';
	import { applyBarTheme } from '$lib/utils/theme';

	const presets = [40, 60, 80, 100, 120, 140];

	let selectedBar: BarWeight = 20;
	let targetValue = '100';
	let hydrated = false;

	onMount(async () => {
		const state = await loadCalculatorState();
		selectedBar = state.preferences.preferredBarWeight;
		targetValue = state.target.value;
		applyBarTheme(selectedBar);
		hydrated = true;
	});

	$: parsedTarget = Number.parseFloat(targetValue.replace(',', '.'));
	$: result = resolveTargetLoad(selectedBar, parsedTarget);
	$: if (browser && hydrated) {
		applyBarTheme(selectedBar);
		void saveTargetState({
			barWeight: selectedBar,
			value: targetValue
		});
	}
</script>

<svelte:head>
	<title>How Heavy | {modeLabels.findPlates}</title>
</svelte:head>

<section class="calculator-shell">
	{#if hydrated}
		<header class="page-header">
			<p class="eyebrow">{modeLabels.findPlates}</p>
			<p class="page-header__desc">{modeDescriptions.findPlates}</p>
		</header>

		<div class="target-layout">
			<!-- Result card is DOM-first → on mobile it appears at top above controls.
			     On desktop the 2-col CSS puts .control-card on the left via order:-1. -->
			<ResultCard {result} />

			<section class="control-card">
				<BarSelector bind:value={selectedBar} onChange={(nextValue) => (selectedBar = nextValue)} />

				<WeightKeypad
					value={targetValue}
					presets={presets}
					helper="Enter a total weight to get the plates needed on each side."
					onValueChange={(nextValue) => (targetValue = nextValue)}
				/>
			</section>
		</div>
	{:else}
		<div class="target-layout" aria-busy="true" aria-label="Loading saved target setup">
			<section class="loading-card target-loading-card">
				<div class="loading-stack">
					<div class="loading-line" style="width: 38%"></div>
					<div class="loading-line" style="width: 58%; height: 2.7rem"></div>
					<div class="loading-line" style="width: 88%"></div>
				</div>
				<div class="loading-grid loading-grid--3">
					<div class="loading-pill"></div>
					<div class="loading-pill"></div>
					<div class="loading-pill"></div>
				</div>
				<div class="loading-block"></div>
			</section>

			<section class="control-card loading-card">
				<div class="loading-grid">
					<div class="loading-pill"></div>
					<div class="loading-pill"></div>
				</div>
				<div class="loading-stack">
					<div class="loading-line" style="width: 34%"></div>
					<div class="loading-line" style="width: 100%; height: 3.35rem"></div>
					<div class="loading-line" style="width: 72%"></div>
				</div>
				<div class="loading-grid loading-grid--3">
					<div class="loading-pill"></div>
					<div class="loading-pill"></div>
					<div class="loading-pill"></div>
					<div class="loading-pill"></div>
					<div class="loading-pill"></div>
					<div class="loading-pill"></div>
				</div>
			</section>
		</div>
	{/if}
</section>

<style>
	.target-layout {
		display: grid;
		gap: 1rem;
	}

	.page-header {
		display: grid;
		gap: 0.2rem;
		padding: 0 0.25rem;
	}

	.page-header__desc {
		font-size: var(--type-body-md);
		color: var(--text-secondary);
		line-height: var(--leading-surface);
		letter-spacing: var(--tracking-body);
	}

	.control-card {
		display: grid;
		gap: 1.25rem;
		padding: 1.2rem;
		background: var(--surface-1);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
		/* Controls appear before the result card on all screen sizes */
		order: -1;
	}

	.target-loading-card {
		min-height: 28rem;
		align-content: start;
	}

	@media (min-width: 62rem) {
		.target-layout {
			grid-template-columns: minmax(20rem, 24rem) minmax(0, 1fr);
			align-items: start;
		}
	}
</style>