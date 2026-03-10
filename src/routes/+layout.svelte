<script lang="ts">
	import { base, resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/material';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>How Heavy</title>
	<meta
		name="description"
		content="Colorful mobile-first calculator for barbell target weight and currently loaded plates."
	/>
</svelte:head>

<div class="app-shell">
	<main class="page-frame">
		{@render children()}
	</main>

	<nav class="primary-nav" aria-label="Primary">
		<a class:active={page.url.pathname === `${base}/`} href={resolve('/')}>Home</a>
		<a class:active={page.url.pathname === `${base}/target/`} href={resolve('/target')}>Target</a>
		<a class:active={page.url.pathname === `${base}/current/`} href={resolve('/current')}>Current</a>
	</nav>
</div>
