
<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import { appName, modeLabels, tagline } from '$lib/site';
	import { loadCalculatorState, savePreferredBarWeight } from '$lib/stores/calculator';
	import type { BarWeight } from '$lib/types/gym';
	import { applyBarTheme } from '$lib/utils/theme';

	let selectedBar: BarWeight = 20;
	let hydrated = false;

	onMount(async () => {
		const state = await loadCalculatorState();
		selectedBar = state.preferences.preferredBarWeight;
		applyBarTheme(selectedBar);
		hydrated = true;
	});

	$: if (browser && hydrated) {
		applyBarTheme(selectedBar);
		void savePreferredBarWeight(selectedBar);
	}
</script>

<svelte:head>
	<title>How Heavy | Home</title>
</svelte:head>

<section class="hero-card hero-card--impact">
	<header class="hero-copy hero-copy--compact">
		<p class="eyebrow">Barbell Loading</p>
		<h1>{appName}</h1>
		<p>{tagline}</p>
	</header>

	<section class="quick-start" aria-label="Quick start">
		<md-filled-button class="hero-action" href={resolve('/target')}>
			<span slot="icon" class="material-symbols-rounded" aria-hidden="true">sports_score</span>
			{modeLabels.findPlates}
		</md-filled-button>
		<md-filled-tonal-button class="hero-action" href={resolve('/current')}>
			<span slot="icon" class="material-symbols-rounded" aria-hidden="true">exercise</span>
			{modeLabels.countPlates}
		</md-filled-tonal-button>
		<md-filled-tonal-button class="hero-action" href={resolve('/sets')}>
			<span slot="icon" class="material-symbols-rounded" aria-hidden="true">bar_chart</span>
			{modeLabels.trainingSets}
		</md-filled-tonal-button>
	</section>

	<section class="preference-strip preference-strip--tight">
		<div class="preference-copy">
			<p class="eyebrow">Default Bar</p>
			<h2>{selectedBar} kg</h2>
		</div>

		<BarSelector
			label="Bar"
			helper=""
			subtle={true}
			showText={false}
			bind:value={selectedBar}
			onChange={(nextValue) => (selectedBar = nextValue)}
		/>
	</section>
</section>

<style>
	.hero-card--impact {
		display: grid;
		gap: 1rem;
	}

	.hero-copy--compact {
		display: grid;
		gap: 0.34rem;
		padding: 1.15rem;
		border-radius: var(--radius-xl);
		border: 1px solid var(--border-subtle);
		background:
			radial-gradient(circle at 90% -10%, color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent) 0%, transparent 60%),
			var(--surface-card);
		box-shadow: var(--shadow-mobile);
	}

	.hero-copy--compact h1 {
		font-size: clamp(2.2rem, 9vw, 3.6rem);
		line-height: 0.94;
		letter-spacing: -0.03em;
	}

	.hero-copy--compact p:not(.eyebrow) {
		margin: 0;
		max-width: 28ch;
		font-size: var(--type-body-md);
		color: var(--text-secondary);
	}

	.quick-start {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.65rem;
	}

	.hero-action {
		width: 100%;
		--md-filled-button-container-shape: 14px;
		--md-filled-button-container-height: 3.2rem;
		--md-filled-tonal-button-container-shape: 14px;
		--md-filled-tonal-button-container-height: 3.2rem;
	}

	.preference-strip {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(13rem, auto);
		align-items: center;
		gap: 0.9rem;
		padding: 1rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		background: color-mix(in srgb, var(--tone-tertiary-surface) 70%, var(--surface-card) 30%);
		box-shadow: var(--shadow-mobile);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
	}

	.preference-strip--tight {
		padding: 0.9rem;
		grid-template-columns: auto minmax(10rem, auto);
	}

	.preference-copy {
		display: grid;
		gap: 0.18rem;
	}

	.preference-copy h2 {
		font-size: clamp(1.25rem, 4vw, 1.7rem);
		line-height: 1.05;
		letter-spacing: var(--tracking-tight);
	}

	@media (max-width: 42rem) {
		.hero-copy--compact {
			padding: 1rem;
		}

		.hero-copy--compact h1 {
			font-size: clamp(2rem, 12vw, 2.8rem);
		}

		.quick-start {
			grid-template-columns: 1fr;
		}

		.hero-action {
			--md-filled-button-container-height: 3rem;
			--md-filled-tonal-button-container-height: 3rem;
		}

		.preference-strip {
			grid-template-columns: 1fr;
			padding: 0.9rem;
		}
	}
</style>
