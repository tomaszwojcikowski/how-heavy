<script lang="ts">
	import { base, resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { modeLabels } from '$lib/site';
	import '$lib/material';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>How Heavy</title>
	<meta
		name="description"
		content="Colorful mobile-first calculator to find the right plates for a target weight or count plates already loaded on the bar."
	/>
</svelte:head>

<div class="app-shell">
	<main class="page-frame">
		{@render children()}
	</main>

	<nav class="primary-nav" aria-label="Primary">
		<a class:active={page.url.pathname === `${base}/`} href={resolve('/')}>
			<span class="nav-icon material-symbols-rounded" aria-hidden="true">home</span>
			<span class="nav-label">Home</span>
			<md-ripple></md-ripple>
		</a>
		<a class:active={page.url.pathname === `${base}/target/`} href={resolve('/target')}>
			<span class="nav-icon material-symbols-rounded" aria-hidden="true">sports_score</span>
			<span class="nav-label">{modeLabels.findPlates}</span>
			<md-ripple></md-ripple>
		</a>
		<a class:active={page.url.pathname === `${base}/current/`} href={resolve('/current')}>
			<span class="nav-icon material-symbols-rounded" aria-hidden="true">exercise</span>
			<span class="nav-label">{modeLabels.countPlates}</span>
			<md-ripple></md-ripple>
		</a>
	</nav>
</div>
