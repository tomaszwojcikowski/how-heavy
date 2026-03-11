<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import PercentageStepper from '$lib/components/PercentageStepper.svelte';
	import ResultCard from '$lib/components/ResultCard.svelte';
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
				<BarSelector
					label="Default bar"
					helper="Changing this updates the start bar for all calculators."
					subtle={true}
					bind:value={selectedBar}
					onChange={(nextValue) => (selectedBar = nextValue)}
				/>

				<div class="target-block">
					<div class="target-copy">
						<p class="target-label">Target total</p>
						<p class="target-helper">Adjust in 2.5 kg steps or type directly.</p>
					</div>

					<PercentageStepper
						value={targetValue}
						label="Target total in kilograms"
						unit="kg"
						placeholder="100"
						step={2.5}
						min={0}
						max={500}
						decrementLabel="Decrease target total by 2.5 kilograms"
						incrementLabel="Increase target total by 2.5 kilograms"
						onChange={(nextValue) => (targetValue = nextValue)}
					/>

					<md-chip-set class="target-presets" aria-label="Common target presets">
						{#each presets as preset (preset)}
							<md-filter-chip
								class="target-preset"
								label="{preset}"
								selected={parsedTarget === preset}
								onclick={() => (targetValue = String(preset))}
							></md-filter-chip>
						{/each}
					</md-chip-set>
				</div>
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

	.target-block {
		display: grid;
		gap: 0.7rem;
	}

	.target-copy {
		display: grid;
		gap: 0.18rem;
	}

	.target-label {
		margin: 0;
		font-size: var(--type-body-sm);
		font-weight: 700;
		color: var(--text-primary);
	}

	.target-helper {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.35;
	}

	.target-presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	:global(.target-preset) {
		--md-filter-chip-container-shape: 999px;
		--md-filter-chip-unselected-container-color: transparent;
		--md-filter-chip-unselected-outline-color: var(--outline);
		--md-filter-chip-unselected-label-text-color: var(--text-secondary);
		--md-filter-chip-selected-container-color: var(--tone-tertiary-surface);
		--md-filter-chip-selected-outline-color: var(--tone-tertiary-border);
		--md-filter-chip-selected-label-text-color: var(--tone-tertiary-text);
		--md-filter-chip-selected-hover-label-text-color: var(--tone-tertiary-text);
		--md-filter-chip-label-text-size: 0.78rem;
		--md-filter-chip-label-text-weight: 700;
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