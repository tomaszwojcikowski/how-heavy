<script lang="ts">
	import { base, resolve } from '$app/paths';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { modeLabels, navLabels } from '$lib/site';
	import { applyBarTheme } from '$lib/utils/theme';
	import { triggerHaptic } from '$lib/utils/haptics';
	import '@material/web/ripple/ripple.js';
	import '../app.css';

	let { children } = $props();

	onNavigate((navigation) => {
		triggerHaptic();
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	onMount(() => {
		const storedBarWeight = window.localStorage.getItem('how-heavy:preferred-bar-weight');
		const preferredBarWeight = storedBarWeight === '15' ? 15 : 20;
		applyBarTheme(preferredBarWeight);
	});
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
		<a class:active={page.url.pathname === `${base}/target/`} href={resolve('/target')} aria-label={modeLabels.findPlates}>
			<span class="nav-icon material-symbols-rounded" aria-hidden="true">sports_score</span>
			<span class="nav-label">{navLabels.findPlates}</span>
			<md-ripple></md-ripple>
		</a>
		<a class:active={page.url.pathname === `${base}/current/`} href={resolve('/current')} aria-label={modeLabels.countPlates}>
			<span class="nav-icon material-symbols-rounded" aria-hidden="true">exercise</span>
			<span class="nav-label">{navLabels.countPlates}</span>
			<md-ripple></md-ripple>
		</a>
		<a class:active={page.url.pathname === `${base}/sets/`} href={resolve('/sets')} aria-label={modeLabels.trainingSets}>
			<span class="nav-icon material-symbols-rounded" aria-hidden="true">bar_chart</span>
			<span class="nav-label">{navLabels.trainingSets}</span>
			<md-ripple></md-ripple>
		</a>
	</nav>
</div>
