<script lang="ts">
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { formatWeight } from '$lib/utils/formatting';
	import type { TargetLoadResult } from '$lib/types/gym';

	export let result: TargetLoadResult;
</script>

<section class="result-card" aria-live="polite">
	<div class="result-card__header">
		<div>
			<p class="eyebrow">Recommendation</p>
			<h3>{formatWeight(result.resolvedTotal ?? result.requestedTotal)}</h3>
		</div>
		<span class:rounded={result.status === 'rounded'} class:warning={result.status !== 'exact'}>
			{result.status}
		</span>
	</div>

	<p class="result-card__message">{result.message}</p>

	<div class="result-card__metrics">
		<div>
			<small>Requested</small>
			<strong>{formatWeight(result.requestedTotal)}</strong>
		</div>
		<div>
			<small>Per side</small>
			<strong>{formatWeight(result.oneSideWeight)}</strong>
		</div>
		<div>
			<small>Adjustment</small>
			<strong>{formatWeight(result.delta)}</strong>
		</div>
	</div>

	<PlateStackPreview barWeight={result.barWeight} plates={result.plates} />

	{#if result.plates.length > 0}
		<ul class="result-card__list">
			{#each result.plates as plate (plate.weight)}
				<li>
					<span>{plate.weight} kg</span>
					<strong>x{plate.count} per side</strong>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.result-card {
		display: grid;
		gap: 1rem;
		padding: 1.2rem;
		background: rgba(255, 250, 245, 0.88);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
	}

	.result-card__header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: start;
	}

	h3 {
		margin: 0;
		font-family: 'Archivo', sans-serif;
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		line-height: 0.95;
	}

	span {
		align-self: start;
		padding: 0.45rem 0.7rem;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		background: rgba(15, 157, 135, 0.14);
		color: #126857;
	}

	span.rounded,
	span.warning {
		background: rgba(255, 111, 60, 0.14);
		color: #8f3719;
	}

	.result-card__message {
		margin: 0;
		color: var(--ink-soft);
	}

	.result-card__metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.result-card__metrics div {
		display: grid;
		gap: 0.35rem;
		padding: 0.85rem;
		border-radius: 1.2rem;
		background: rgba(255, 255, 255, 0.72);
		border: 1px solid var(--outline);
	}

	small {
		color: var(--ink-soft);
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	strong {
		font-family: 'Archivo', sans-serif;
	}

	.result-card__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}

	.result-card__list li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0.9rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.62);
		border: 1px solid var(--outline);
	}

	@media (max-width: 40rem) {
		.result-card__metrics {
			grid-template-columns: 1fr;
		}
	}
</style>