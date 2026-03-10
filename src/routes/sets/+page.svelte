<script lang="ts">
	import { afterUpdate } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import PercentageStepper from '$lib/components/PercentageStepper.svelte';
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { modeDescriptions, modeLabels } from '$lib/site';
	import { formatWeight } from '$lib/utils/formatting';
	import { computeSmartSetSequence } from '$lib/utils/sets';
	import type { BarWeight, PlateCount } from '$lib/types/gym';

	const DEFAULT_PERCENTAGES = ['60', '70', '80', '85', '90'];
	const MAX_STEPS = 10;

	let selectedBar: BarWeight = 20;
	let oneRmValue = '100';
	let oneRmFieldEl: HTMLElement | undefined;

	let steps: Array<{ id: number; percentage: string }> = DEFAULT_PERCENTAGES.map((p, i) => ({
		id: i + 1,
		percentage: p
	}));
	let nextId = DEFAULT_PERCENTAGES.length + 1;

	afterUpdate(() => {
		if (oneRmFieldEl) {
			(oneRmFieldEl as any).value = oneRmValue;
		}
	});

	$: parsedOneRm = Number.parseFloat(oneRmValue.replace(',', '.'));

	let computedSteps: ReturnType<typeof computeSmartSetSequence> = [];
	$: if (Number.isFinite(parsedOneRm) && parsedOneRm > selectedBar) {
		computedSteps = computeSmartSetSequence(steps, selectedBar, parsedOneRm);
	}

	function adjustOneRm(delta: number) {
		const base = Number.parseFloat(oneRmValue.replace(',', '.'));
		if (!Number.isFinite(base)) return;
		const next = Math.max(0, Number.parseFloat((base + delta).toFixed(2)));
		oneRmValue = String(next);
	}

	function addStep() {
		if (steps.length >= MAX_STEPS) return;
		steps = [...steps, { id: nextId++, percentage: '' }];
	}

	function removeStep(id: number) {
		steps = steps.filter((s) => s.id !== id);
	}

	function updatePercentage(id: number, value: string) {
		steps = steps.map((s) => (s.id === id ? { ...s, percentage: value } : s));
	}

	function formatPlateChange(plates: PlateCount[]): string {
		if (plates.length === 0) return '';
		return plates
			.map((p) => (p.count > 1 ? `${p.count}×${p.weight}` : String(p.weight)))
			.join(' + ') + ' kg/side';
	}
</script>

<svelte:head>
	<title>How Heavy | {modeLabels.trainingSets}</title>
</svelte:head>

<section class="calculator-shell">
	<header class="page-header">
		<p class="eyebrow">{modeLabels.trainingSets}</p>
		<p class="page-header__desc">{modeDescriptions.trainingSets}</p>
	</header>

	<!-- 1RM setup card -->
	<section class="setup-card">
		<BarSelector bind:value={selectedBar} onChange={(v) => (selectedBar = v)} />

		<div class="orm-row">
			<button type="button" class="adj-btn" onclick={() => adjustOneRm(-2.5)} aria-label="Decrease by 2.5 kg">
				<span class="material-symbols-rounded" aria-hidden="true">remove</span>
				<span class="adj-label">2.5</span>
			</button>
			<md-outlined-text-field
				bind:this={oneRmFieldEl}
				type="text"
				label="1 Rep Max (1RM)"
				suffix-text="kg"
				inputmode="decimal"
				placeholder="100"
				supporting-text="Your one-rep max — percentages are calculated from this."
				oninput={(e: Event) => (oneRmValue = (e.currentTarget as any).value)}
			></md-outlined-text-field>
			<button type="button" class="adj-btn" onclick={() => adjustOneRm(2.5)} aria-label="Increase by 2.5 kg">
				<span class="material-symbols-rounded" aria-hidden="true">add</span>
				<span class="adj-label">2.5</span>
			</button>
		</div>
	</section>

	<!-- Steps list -->
	<div class="steps-list">
		{#each steps as step, stepIndex (step.id)}
			{@const computed = computedSteps.find((c) => c.id === step.id)}
			<div class="step-card"
				in:fly={{ y: 20, duration: 220, easing: cubicOut }}
				out:scale={{ duration: 160, start: 0.94 }}
				animate:flip={{ duration: 280, easing: cubicOut }}
			>
				<!-- Step header -->
				<div class="step-card__header">
					<div class="step-card__meta">
						<span class="step-label">Set {stepIndex + 1}</span>
						{#if computed}
							<span class="step-weight">{formatWeight(computed.result.resolvedTotal ?? computed.result.requestedTotal)}</span>
						{/if}
					</div>

					<div class="step-card__controls">
						<PercentageStepper
							value={step.percentage}
							label="Percentage for set {stepIndex + 1}"
							onChange={(v) => updatePercentage(step.id, v)}
							onRemove={() => removeStep(step.id)}
							removeLabel="Remove set {stepIndex + 1}"
						/>
					</div>
				</div>

				{#if computed && (computed.result.status === 'exact' || computed.result.status === 'rounded')}
					<!-- Change pills vs previous step -->
					{#if stepIndex > 0}
						<div class="step-diff">
							{#if computed.removals.length > 0}
								<span class="diff-pill diff-pill--remove">
									<span class="material-symbols-rounded" aria-hidden="true">remove</span>
									{formatPlateChange(computed.removals)}
								</span>
							{/if}
							{#if computed.additions.length > 0}
								<span class="diff-pill diff-pill--add">
									<span class="material-symbols-rounded" aria-hidden="true">add</span>
									{formatPlateChange(computed.additions)}
								</span>
							{:else if computed.removals.length === 0}
								<span class="diff-pill diff-pill--same">
									<span class="material-symbols-rounded" aria-hidden="true">done</span>
									No change
								</span>
							{/if}
						</div>
					{:else}
						<div class="step-diff">
							<span class="diff-pill diff-pill--add">
								<span class="material-symbols-rounded" aria-hidden="true">fitness_center</span>
								Initial load
							</span>
						</div>
					{/if}

					<!-- Bar visualization -->
					<PlateStackPreview
						barWeight={selectedBar}
						plates={computed.result.plates}
						emptyMessage="Empty bar — no plates needed."
					/>
				{:else if step.percentage === ''}
					<p class="step-placeholder">Enter a percentage above</p>
				{:else if computed?.result.status === 'below-bar'}
					<p class="step-placeholder step-placeholder--warn">
						<span class="material-symbols-rounded" aria-hidden="true">warning</span>
						Below bar weight ({formatWeight(selectedBar)} minimum)
					</p>
				{:else if computed?.result.status === 'invalid' || !computed}
					<p class="step-placeholder">
						<span class="material-symbols-rounded" aria-hidden="true">calculate</span>
						Enter a valid 1RM to calculate
					</p>
				{/if}
			</div>
		{/each}

		{#if steps.length < MAX_STEPS}
			<button type="button" class="add-step-btn" onclick={addStep}>
				<span class="material-symbols-rounded" aria-hidden="true">add</span>
				Add set
			</button>
		{/if}
	</div>
</section>

<style>
	.page-header {
		display: grid;
		gap: 0.2rem;
		padding: 0 0.25rem;
	}

	.page-header__desc {
		font-size: var(--type-body-md);
		color: var(--text-secondary);
		line-height: var(--leading-surface);
		letter-spacing: var(--tracking-body);
	}

	.setup-card {
		display: grid;
		gap: 1.25rem;
		padding: 1.2rem;
		background: var(--surface-1);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
		transition: box-shadow 180ms cubic-bezier(0.2, 0, 0, 1);
	}

	.orm-row {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
	}

	.orm-row md-outlined-text-field {
		flex: 1;
		min-width: 0;
	}

	.adj-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		padding: 0.5rem 0.7rem;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--outline);
		background: var(--md-sys-color-surface-container-lowest);
		color: var(--text-primary);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.12s ease;
		font-variant-numeric: tabular-nums;
	}

	.adj-btn:hover { background: var(--surface-2); }
	.adj-btn:active { background: var(--surface-3); }

	.adj-btn .material-symbols-rounded {
		font-size: 1.15rem;
		font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
	}

	.adj-label {
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--text-secondary);
		line-height: 1;
	}

	/* Steps */
	.steps-list {
		display: grid;
		gap: 0.75rem;
	}

	.step-card {
		display: grid;
		gap: 0.85rem;
		padding: 1rem 1.1rem;
		background: var(--surface-1);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
		transition: box-shadow 180ms cubic-bezier(0.2, 0, 0, 1);
	}

	.step-card__header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		justify-content: space-between;
	}

	.step-card__meta {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
	}

	.step-label {
		font-size: var(--type-label);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-secondary);
	}

	.step-weight {
		font-family: 'Archivo', sans-serif;
		font-size: clamp(1.1rem, 2.5vw, 1.4rem);
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: var(--tracking-tight);
	}

	.step-card__controls {
		flex-shrink: 0;
	}

	/* Diff pills */
	.step-diff {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.diff-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.3rem 0.65rem;
		border-radius: 999px;
		font-size: var(--type-label);
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.diff-pill .material-symbols-rounded {
		font-size: 0.9rem;
		font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20;
	}

	.diff-pill--add {
		background: var(--tone-secondary-surface);
		color: var(--tone-secondary-text);
	}

	.diff-pill--remove {
		background: var(--tone-primary-surface);
		color: var(--tone-primary-text);
	}

	.diff-pill--same {
		background: var(--md-sys-color-surface-container-lowest);
		color: var(--text-secondary);
		border: 1px solid var(--outline);
	}

	/* Placeholders */
	.step-placeholder {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0.6rem 0;
		color: var(--text-secondary);
		font-size: var(--type-body-sm);
	}

	.step-placeholder .material-symbols-rounded {
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	.step-placeholder--warn {
		color: var(--tone-primary-text);
	}

	/* Add step button */
	.add-step-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.85rem;
		border-radius: var(--radius-xl);
		border: 1.5px dashed var(--outline);
		background: transparent;
		color: var(--text-secondary);
		font-size: var(--type-body-md);
		font-weight: 600;
		cursor: pointer;
		transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
	}

	.add-step-btn:hover {
		background: var(--surface-1);
		color: var(--text-primary);
		border-color: var(--accent-primary);
	}

	.add-step-btn .material-symbols-rounded {
		font-size: 1.2rem;
	}
</style>
