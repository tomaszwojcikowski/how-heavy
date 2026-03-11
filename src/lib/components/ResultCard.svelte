<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { formatWeight } from '$lib/utils/formatting';
	import { triggerHaptic } from '$lib/utils/haptics';
	import type { PlateCount, TargetLoadResult } from '$lib/types/gym';

	export let result: TargetLoadResult;

	const statusMeta: Record<TargetLoadResult['status'], { icon: string; label: string; tone: 'success' | 'info' | 'warning' }> = {
		exact: { icon: 'check_circle', label: 'Exact match', tone: 'success' },
		rounded: { icon: 'published_with_changes', label: 'Closest match', tone: 'info' },
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
		: `${formatWeight(result.barWeight)} min`;
	$: eyebrowText = hasValidResult
		? result.plates.length === 0
			? 'No plates needed'
			: 'Plates per side'
		: 'Bar minimum';

	let copied = false;

	function copyWeight() {
		triggerHaptic(15);
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
			<p class="result-placeholder__hint">Enter a total and pick a bar to see the plates per side.</p>
		</div>
	{:else}
		<div class="result-content" in:fly={{ y: 10, duration: 220, easing: cubicOut }} out:fade={{ duration: 100 }}>
		<div class="result-card__header">
			<div class="result-card__headline">
				<p class="eyebrow">{eyebrowText}</p>
					<h3 class="weight-display">{headlineText}</h3>
			</div>
			<md-assist-chip
				class="status-chip"
				class:status-chip--info={statusMeta[result.status].tone === 'info'}
				class:status-chip--warning={statusMeta[result.status].tone === 'warning'}
				label={statusMeta[result.status].label}
			>
				<span slot="icon" class="material-symbols-rounded" aria-hidden="true"
					>{statusMeta[result.status].icon}</span
				>
			</md-assist-chip>
		</div>

		{#if isRounded || isBelowBar}
			<p class="result-card__message">{result.message}</p>
		{/if}

		{#if hasValidResult}
			<div class="result-card__metrics" class:result-card__metrics--2col={isRounded}>
				{#if isRounded}
					<div>
						<small>Requested</small>
						<strong class="weight-display">{formatWeight(result.requestedTotal)}</strong>
					</div>
					<div>
						<small>Loaded</small>
						<strong class="weight-display">{formatWeight(result.resolvedTotal)}</strong>
					</div>
				{:else}
					<div>
						<small>Total</small>
						<strong class="weight-display">{formatWeight(result.resolvedTotal)}</strong>
					</div>
				{/if}
			</div>

			<PlateStackPreview barWeight={result.barWeight} plates={result.plates} viewTransitionName="barbell-preview" />

			<div class="result-card__actions">
				<md-filled-tonal-button
					onclick={copyWeight}
					aria-label="Copy weight to clipboard"
				>
					<span slot="icon" class="material-symbols-rounded" aria-hidden="true"
						>{copied ? 'check' : 'content_copy'}</span
					>
					{copied ? 'Copied' : 'Copy'}
				</md-filled-tonal-button>
			</div>
		{/if}
		</div><!-- /.result-content -->
	{/if}
</section>

<style>
	.result-card {
		display: grid;
		gap: 1rem;
		padding: var(--card-padding);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-soft);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
		transition: box-shadow 180ms cubic-bezier(0.2, 0, 0, 1);
		contain: layout paint style;
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

	:global(.status-chip) {
		--md-assist-chip-container-color: var(--chip-success-surface);
		--md-assist-chip-outline-color: var(--chip-success-border);
		--md-assist-chip-label-text-color: var(--chip-success-text);
		--md-assist-chip-icon-color: var(--chip-success-text);
		--md-assist-chip-label-text-weight: 700;
		--md-assist-chip-label-text-size: 0.72rem;
		--md-assist-chip-label-text-transform: uppercase;
		--md-assist-chip-label-text-tracking: 0.06em;
		align-self: start;
		flex-shrink: 0;
	}

	:global(.status-chip--info) {
		--md-assist-chip-container-color: var(--chip-info-surface);
		--md-assist-chip-outline-color: var(--chip-info-border);
		--md-assist-chip-label-text-color: var(--chip-info-text);
		--md-assist-chip-icon-color: var(--chip-info-text);
	}

	:global(.status-chip--warning) {
		--md-assist-chip-container-color: var(--chip-warning-surface);
		--md-assist-chip-outline-color: var(--chip-warning-border);
		--md-assist-chip-label-text-color: var(--chip-warning-text);
		--md-assist-chip-icon-color: var(--chip-warning-text);
	}

	:global(.status-chip [slot='icon']) {
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
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 88%, transparent);
		border: 1px solid var(--border-subtle);
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

	:global(.result-card__actions md-filled-tonal-button [slot='icon']) {
		font-size: 1.1rem;
		font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
	}

	@media (max-width: 40rem) {
		.result-card {
			padding: var(--card-padding-mobile);
			box-shadow: var(--shadow-mobile);
		}

		.result-card__header {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		:global(.status-chip) {
			width: fit-content;
		}

		.result-card__actions {
			display: grid;
		}

		:global(.result-card__actions md-filled-tonal-button) {
			width: 100%;
		}
	}


</style>