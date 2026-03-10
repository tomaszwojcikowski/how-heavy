<script lang="ts">
	import { resolve } from '$app/paths';
	import { appName, tagline } from '$lib/site';
</script>

<svelte:head>
	<title>How Heavy | Home</title>
</svelte:head>

<section class="hero-card">
	<div class="hero-copy">
		<h1>{appName}</h1>
		<p>{tagline}</p>
	</div>

	<div class="hero-actions">
		<a class="cta cta-primary" href={resolve('/target')}>Target calculator</a>
		<a class="cta cta-secondary" href={resolve('/current')}>Current setup</a>
	</div>
</section>
