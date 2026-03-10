<script lang="ts">
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { formatWeight } from '$lib/utils/formatting';
	import type { PlateCount, TargetLoadResult } from '$lib/types/gym';

	export let result: TargetLoadResult;

	const statusMeta: Record<TargetLoadResult['status'], { icon: string; label: string; tone: 'exact' | 'rounded' | 'warning' }> = {
		exact: { icon: 'check_circle', label: 'Exact Match', tone: 'exact' },
		rounded: { icon: 'published_with_changes', label: 'Nearest Match', tone: 'rounded' },
		'below-bar': { icon: 'warning', label: 'Below Bar', tone: 'warning' },
		invalid: { icon: 'error', label: 'Check Input', tone: 'warning' }
	};

	function formatPlatesPerSide(plates: PlateCount[]): string {
		if (plates.length === 0) return '—';
		return plates.map((p) => (p.count > 1 ? `${p.count}×${p.weight}` : String(p.weight))).join(' + ') + ' kg';
	}

	let copied = false;

	function copyWeight() {
		const text = formatWeight(result.resolvedTotal ?? result.requestedTotal);
		navigator.clipboard.writeText(text).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}
</script>

<section class="result-card" aria-live="polite">
	<div class="result-card__header">
		<div class="result-card__headline">
			<p class="eyebrow">Load per side</p>
			<h3>{formatPlatesPerSide(result.plates)}</h3>
		</div>
		<div class="result-card__status" class:rounded={statusMeta[result.status].tone === 'rounded'} class:warning={statusMeta[result.status].tone === 'warning'}>
			<span class="material-symbols-rounded result-card__status-icon" aria-hidden="true">{statusMeta[result.status].icon}</span>
			<span>{statusMeta[result.status].label}</span>
		</div>
	</div>

	<p class="result-card__message">{result.message}</p>

	<div class="result-card__metrics">
		<div>
			<small>Total</small>
			<strong>{formatWeight(result.resolvedTotal ?? result.requestedTotal)}</strong>
		</div>
		<div>
			<small>Requested</small>
			<strong>{formatWeight(result.requestedTotal)}</strong>
		</div>
		<div>
			<small>Adjustment</small>
			<strong>{formatWeight(result.delta)}</strong>
		</div>
	</div>

	<PlateStackPreview barWeight={result.barWeight} plates={result.plates} />

	<div class="result-card__actions">
		<button type="button" class="copy-btn" onclick={copyWeight} aria-label="Copy total weight to clipboard">
			<span class="material-symbols-rounded" aria-hidden="true">{copied ? 'check' : 'content_copy'}</span>
			{copied ? 'Copied' : 'Copy weight'}
		</button>
	</div>
</section>

<style>
	.result-card {
		display: grid;
		gap: 1rem;
		padding: 1.2rem;
		background: var(--surface-1);
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

	.result-card__headline {
		min-width: 0;
	}

	h3 {
		margin: 0;
		font-family: 'Archivo', sans-serif;
		font-size: clamp(1.5rem, 3.5vw, 2.2rem);
		line-height: 1.06;
		letter-spacing: var(--tracking-tight);
		word-break: break-word;
	}

	.result-card__status {
		align-self: start;
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.7rem;
		border-radius: 6px;
		font-size: 0.82rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: var(--leading-label);
		background: var(--tone-secondary-surface);
		color: var(--tone-secondary-text);
	}

	.result-card__status.rounded,
	.result-card__status.warning {
		background: var(--tone-primary-surface);
		color: var(--tone-primary-text);
	}

	.result-card__status-icon {
		font-size: 1rem;
	}

	.result-card__message {
		margin: 0;
		color: var(--text-secondary);
		font-size: var(--type-body-md);
		line-height: var(--leading-surface);
		letter-spacing: var(--tracking-body);
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
		background: var(--md-sys-color-surface-container-lowest);
		border: 1px solid var(--outline);
	}

	small {
		color: var(--text-secondary);
		font-size: var(--type-label);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		line-height: var(--leading-label);
	}

	strong {
		font-family: 'Archivo', sans-serif;
	}

	.result-card__actions {
		display: flex;
	}

	.copy-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--outline);
		background: var(--md-sys-color-surface-container-lowest);
		color: var(--text-secondary);
		font-size: var(--type-body-sm);
		font-weight: 600;
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.copy-btn:hover {
		color: var(--text-primary);
		background: var(--surface-2);
	}

	.copy-btn .material-symbols-rounded {
		font-size: 1.1rem;
		font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
	}

	@media (max-width: 40rem) {
		.result-card__metrics {
			grid-template-columns: 1fr;
		}
	}
</style>