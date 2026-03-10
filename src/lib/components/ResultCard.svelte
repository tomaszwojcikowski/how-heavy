<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { formatWeight } from '$lib/utils/formatting';
	import type { PlateCount, TargetLoadResult } from '$lib/types/gym';

	export let result: TargetLoadResult;

	const statusMeta: Record<TargetLoadResult['status'], { icon: string; label: string; tone: 'exact' | 'rounded' | 'warning' }> = {
		exact: { icon: 'check_circle', label: 'Exact match', tone: 'exact' },
		rounded: { icon: 'published_with_changes', label: 'Nearest match', tone: 'rounded' },
		'below-bar': { icon: 'warning', label: 'Below bar', tone: 'warning' },
		invalid: { icon: 'error', label: 'Check input', tone: 'warning' }
	};

	function formatPlatesPerSide(plates: PlateCount[]): string {
		if (plates.length === 0) return '—';
		return plates.map((p) => (p.count > 1 ? `${p.count}×${p.weight}` : String(p.weight))).join(' + ') + ' kg';
	}

	$: hasValidResult = result.status === 'exact' || result.status === 'rounded';
	$: isRounded = result.status === 'rounded';
	$: isBelowBar = result.status === 'below-bar';
	$: headlineText = hasValidResult
		? result.plates.length === 0
			? 'Empty bar'
			: formatPlatesPerSide(result.plates)
		: `${formatWeight(result.barWeight)} minimum`;
	$: eyebrowText = hasValidResult
		? result.plates.length === 0
			? 'No plates needed'
			: 'Plates per side'
		: 'Below bar weight';

	let copied = false;

	function copyWeight() {
		const total = formatWeight(result.resolvedTotal ?? result.requestedTotal);
		const breakdown =
			result.plates.length > 0 ? ' (' + formatPlatesPerSide(result.plates) + ' per side)' : '';
		navigator.clipboard.writeText(total + breakdown).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}
</script>

<section class="result-card" aria-live="polite">
	{#if result.status === 'invalid'}
		<div class="result-placeholder" transition:fade={{ duration: 150 }}>
			<span class="material-symbols-rounded result-placeholder__icon" aria-hidden="true">calculate</span>
			<p class="result-placeholder__title">Ready to calculate</p>
			<p class="result-placeholder__hint">Enter a target weight and choose a bar to see which plates to load per side</p>
		</div>
	{:else}
		<div class="result-content" in:fly={{ y: 10, duration: 220, easing: cubicOut }} out:fade={{ duration: 100 }}>
		<div class="result-card__header">
			<div class="result-card__headline">
				<p class="eyebrow">{eyebrowText}</p>
				<h3>{headlineText}</h3>
			</div>
			<div
				class="result-card__status"
				class:rounded={statusMeta[result.status].tone === 'rounded'}
				class:warning={statusMeta[result.status].tone === 'warning'}
			>
				<span class="material-symbols-rounded result-card__status-icon" aria-hidden="true"
					>{statusMeta[result.status].icon}</span
				>
				<span>{statusMeta[result.status].label}</span>
			</div>
		</div>

		{#if isRounded || isBelowBar}
			<p class="result-card__message">{result.message}</p>
		{/if}

		{#if hasValidResult}
			<div class="result-card__metrics" class:result-card__metrics--2col={isRounded}>
				{#if isRounded}
					<div>
						<small>Requested</small>
						<strong>{formatWeight(result.requestedTotal)}</strong>
					</div>
					<div>
						<small>Loaded</small>
						<strong>{formatWeight(result.resolvedTotal)}</strong>
					</div>
				{:else}
					<div>
						<small>Total loaded</small>
						<strong>{formatWeight(result.resolvedTotal)}</strong>
					</div>
				{/if}
			</div>

			<PlateStackPreview barWeight={result.barWeight} plates={result.plates} />

			<div class="result-card__actions">
				<button
					type="button"
					class="copy-btn"
					onclick={copyWeight}
					aria-label="Copy weight to clipboard"
				>
					<span class="material-symbols-rounded" aria-hidden="true"
						>{copied ? 'check' : 'content_copy'}</span
					>
					{copied ? 'Copied' : 'Copy'}
				</button>
			</div>
		{/if}
		</div><!-- /.result-content -->
	{/if}
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
		transition: box-shadow 180ms cubic-bezier(0.2, 0, 0, 1);
	}

	.result-content {
		display: grid;
		gap: 1rem;
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
		padding: 0.4rem 0.75rem 0.4rem 0.6rem;
		border-radius: 999px;
		border: 1px solid var(--tone-secondary-border);
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: var(--leading-label);
		background: var(--tone-secondary-surface);
		color: var(--tone-secondary-text);
	}

	.result-card__status.rounded,
	.result-card__status.warning {
		background: var(--tone-primary-surface);
		border-color: var(--tone-primary-border);
		color: var(--tone-primary-text);
	}

	.result-card__status-icon {
		font-size: 0.95rem;
		font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20;
	}

	.result-card__message {
		margin: 0;
		color: var(--text-secondary);
		font-size: var(--type-body-md);
		line-height: var(--leading-surface);
		letter-spacing: var(--tracking-body);
	}

	.result-placeholder {
		display: grid;
		place-items: center;
		gap: 0.5rem;
		padding: 2.5rem 1rem;
		text-align: center;
	}

	.result-placeholder__icon {
		font-size: 2.75rem;
		color: var(--text-tertiary);
		font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48;
		margin-bottom: 0.25rem;
	}

	.result-placeholder__title {
		font-weight: 700;
		color: var(--text-primary);
		font-size: var(--type-body-lg);
	}

	.result-placeholder__hint {
		color: var(--text-secondary);
		font-size: var(--type-body-sm);
		line-height: var(--leading-surface);
		max-width: 26ch;
	}

	.result-card__metrics {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.result-card__metrics--2col {
		grid-template-columns: repeat(2, minmax(0, 1fr));
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
		border-radius: 999px;
		border: 1px solid var(--tone-secondary-border);
		background: var(--tone-secondary-surface);
		color: var(--tone-secondary-text);
		font-size: var(--type-body-sm);
		font-weight: 700;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.copy-btn:hover {
		background: color-mix(in srgb, var(--tone-secondary-surface) 88%, white 12%);
		box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-secondary) 18%, transparent);
	}

	.copy-btn .material-symbols-rounded {
		font-size: 1.1rem;
		font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
	}


</style>