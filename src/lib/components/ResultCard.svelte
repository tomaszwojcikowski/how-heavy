<script lang="ts">
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { formatWeight } from '$lib/utils/formatting';
	import type { TargetLoadResult } from '$lib/types/gym';
	import { PLATE_MAP } from '$lib/utils/plates';

	export let result: TargetLoadResult;

	const statusMeta: Record<TargetLoadResult['status'], { icon: string; label: string; tone: 'exact' | 'rounded' | 'warning' }> = {
		exact: { icon: 'check_circle', label: 'Exact Match', tone: 'exact' },
		rounded: { icon: 'published_with_changes', label: 'Nearest Match', tone: 'rounded' },
		'below-bar': { icon: 'warning', label: 'Below Bar', tone: 'warning' },
		invalid: { icon: 'error', label: 'Check Input', tone: 'warning' }
	};

	function plateStyle(weight: number): string {
		const p = PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP];
		return `background:${p.color};color:${p.textColor};border-color:${p.edgeColor}`;
	}
</script>

<section class="result-card" aria-live="polite">
	<div class="result-card__header">
		<div>
			<p class="eyebrow">Recommendation</p>
			<h3>{formatWeight(result.resolvedTotal ?? result.requestedTotal)}</h3>
		</div>
		<div class="result-card__status" class:rounded={statusMeta[result.status].tone === 'rounded'} class:warning={statusMeta[result.status].tone === 'warning'}>
			<span class="material-symbols-rounded result-card__status-icon" aria-hidden="true">{statusMeta[result.status].icon}</span>
			<span>{statusMeta[result.status].label}</span>
		</div>
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
				<li style={plateStyle(plate.weight)}>
					<span>{plate.weight} kg</span>
					<strong>×{plate.count} per side</strong>
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
		line-height: 1.02;
	}

	.result-card__status {
		align-self: start;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.7rem;
		border-radius: 6px;
		font-size: 0.82rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		background: rgba(15, 157, 135, 0.16);
		color: #0d5a4d;
	}

	.result-card__status.rounded,
	.result-card__status.warning {
		background: rgba(255, 111, 60, 0.14);
		color: #7a2f15;
	}

	.result-card__status-icon {
		font-size: 1rem;
	}

	.result-card__message {
		margin: 0;
		color: var(--ink-muted);
		font-size: var(--type-body-md);
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
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.72);
		border: 1px solid var(--outline);
	}

	small {
		color: var(--ink-muted);
		font-size: var(--type-label);
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
		border-radius: 6px;
		/* color/background/border set inline via plateStyle() */
		border: 1px solid;
	}

	@media (max-width: 40rem) {
		.result-card__metrics {
			grid-template-columns: 1fr;
		}
	}
</style>