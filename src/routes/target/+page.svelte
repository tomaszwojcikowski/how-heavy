<script lang="ts">
	import BarSelector from '$lib/components/BarSelector.svelte';
	import ResultCard from '$lib/components/ResultCard.svelte';
	import WeightKeypad from '$lib/components/WeightKeypad.svelte';
	import type { BarWeight } from '$lib/types/gym';
	import { resolveTargetLoad } from '$lib/utils/calculations';

	const presets = [40, 60, 80, 100, 120, 140];

	let selectedBar: BarWeight = 20;
	let targetValue = '100';

	$: parsedTarget = Number.parseFloat(targetValue.replace(',', '.'));
	$: result = resolveTargetLoad(selectedBar, parsedTarget);
</script>

<svelte:head>
	<title>How Heavy | Target</title>
</svelte:head>

<section class="calculator-shell">
	<header class="section-heading">
		<p class="eyebrow">Target mode</p>
		<h2>Plan a total weight</h2>
		<p>Pick a bar, enter a target, and get the exact one-side plate stack or the nearest achievable total.</p>
	</header>

	<div class="target-layout">
		<section class="control-card">
			<BarSelector bind:value={selectedBar} onChange={(nextValue) => (selectedBar = nextValue)} />

			<WeightKeypad
				value={targetValue}
				presets={presets}
				helper="Common targets are one tap away. Decimal values are supported."
				onValueChange={(nextValue) => (targetValue = nextValue)}
			/>

			<div class="control-card__hint">
				<small>Supports bumper plates of 5, 10, 15, and 20 kg plus change plates from 0.5 to 2.5 kg.</small>
			</div>
		</section>

		<ResultCard {result} />
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

	.control-card__hint {
		padding: 0.9rem 1rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid var(--outline);
	}

	small {
		color: var(--ink-soft);
	}

	@media (min-width: 62rem) {
		.target-layout {
			grid-template-columns: minmax(20rem, 24rem) minmax(0, 1fr);
			align-items: start;
		}
	}
</style>