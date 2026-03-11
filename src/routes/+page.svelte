
<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import { appName, featureHighlights, modeDescriptions, modeLabels, tagline } from '$lib/site';
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

<section class="hero-card">
	<div class="hero-copy">
		<h1>{appName}</h1>
		<p>{tagline}</p>
	</div>

	<div class="mode-grid">
		<section class="mode-card mode-card--primary">
			<p class="eyebrow">Pick Plates</p>
			<h2>{modeLabels.findPlates}</h2>
			<p>{modeDescriptions.findPlates}</p>
			<md-filled-button href={resolve('/target')}>Open {modeLabels.findPlates}</md-filled-button>
		</section>

		<section class="mode-card">
			<p class="eyebrow">Read The Bar</p>
			<h2>{modeLabels.countPlates}</h2>
			<p>{modeDescriptions.countPlates}</p>
			<md-filled-tonal-button href={resolve('/current')}>Open {modeLabels.countPlates}</md-filled-tonal-button>
		</section>
	</div>

	<section class="preference-strip">
		<div class="preference-copy">
			<p class="eyebrow">Default Bar</p>
			<h2>{selectedBar} kg bar</h2>
			<p>Used first on every screen.</p>
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

<ul class="feature-list">
	{#each featureHighlights as highlight (highlight)}
		<li>
			<span class="feature-icon material-symbols-rounded" aria-hidden="true">check_circle</span>
			<span>{highlight}</span>
		</li>
	{/each}
</ul>

<style>
	.preference-strip {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(13rem, auto);
		align-items: center;
		gap: 0.9rem;
		padding: 0.95rem 1rem;
		border-radius: var(--radius-xl);
		border: 1px solid var(--outline);
		background: color-mix(in srgb, var(--tone-tertiary-surface) 72%, var(--md-sys-color-surface-container-lowest) 28%);
	}

	.preference-copy {
		display: grid;
		gap: 0.18rem;
	}

	.preference-copy h2 {
		font-size: 1rem;
		line-height: 1.05;
		letter-spacing: var(--tracking-tight);
	}

	.preference-copy p:not(.eyebrow) {
		font-size: var(--type-body-sm);
		color: var(--text-secondary);
		line-height: var(--leading-surface);
		letter-spacing: var(--tracking-body);
	}

	.mode-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.mode-card {
		display: grid;
		gap: 0.6rem;
		padding: 1rem;
		background: var(--surface-4, var(--surface-1));
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
	}

	.mode-card--primary {
		background: var(--texture-noise-muted), var(--md-sys-color-primary-container);
	}

	.mode-card h2 {
		font-size: var(--type-title);
		line-height: 1.05;
		letter-spacing: var(--tracking-tight);
	}

	.mode-card p:not(.eyebrow) {
		font-size: var(--type-body-md);
		color: var(--text-secondary);
		line-height: var(--leading-surface);
		letter-spacing: var(--tracking-body);
	}

	.mode-card md-filled-button,
	.mode-card md-filled-tonal-button {
		width: 100%;
	}

	.feature-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}

	.feature-list li {
		display: flex;
		align-items: flex-start;
		gap: 0.8rem;
		padding: 0.9rem 1rem;
		background: var(--surface-1);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		font-size: var(--type-body-md);
		color: var(--text-secondary);
		line-height: var(--leading-surface);
		letter-spacing: var(--tracking-body);
	}

	.feature-icon {
		color: var(--accent-secondary);
		font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
		flex-shrink: 0;
		margin-top: 0.05rem;
	}

	@media (max-width: 42rem) {
		.preference-strip {
			grid-template-columns: 1fr;
			padding: 0.9rem;
		}

		.mode-grid {
			grid-template-columns: 1fr;
		}

		.mode-card {
			padding: 0.95rem;
		}

		.feature-list li {
			padding: 0.8rem 0.9rem;
		}
	}
</style>
