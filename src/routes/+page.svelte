<script lang="ts">
	import { resolve } from '$app/paths';
	import { featureHighlights } from '$lib/site';
</script>

<svelte:head>
	<title>How Heavy | Home</title>
</svelte:head>

<section class="hero-card">
	<div class="hero-copy">
		<p class="eyebrow">Phase 1 foundation</p>
		<h2>Load it right, fast.</h2>
		<p>
			A mobile-first Svelte app for CrossFit-style barbell setup, tuned for GitHub Pages and GitHub
			Actions from day one.
		</p>
	</div>

	<div class="hero-actions">
		<a class="cta cta-primary" href={resolve('/target')}>Target calculator</a>
		<a class="cta cta-secondary" href={resolve('/current')}>Current setup</a>
	</div>
</section>

<section class="feature-grid" aria-label="Feature highlights">
	{#each featureHighlights as item (item)}
		<article class="feature-card">
			<p>{item}</p>
		</article>
	{/each}
</section>
