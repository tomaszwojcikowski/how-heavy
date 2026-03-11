<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import PercentageStepper from '$lib/components/PercentageStepper.svelte';
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { modeDescriptions, modeLabels } from '$lib/site';
	import { loadCalculatorState, saveSetsState } from '$lib/stores/calculator';
	import { formatWeight } from '$lib/utils/formatting';
	import { buildSetStepsFromTemplate, computeSmartSetSequence, SET_TEMPLATES, type SetTemplate } from '$lib/utils/sets';
	import type { BarWeight, PlateCount } from '$lib/types/gym';
	import { applyBarTheme } from '$lib/utils/theme';
	import { triggerHaptic } from '$lib/utils/haptics';

	const DEFAULT_PERCENTAGES = ['60', '70', '80', '85', '90'];
	const MAX_STEPS = 10;

	let selectedBar: BarWeight = 20;
	let oneRmValue = '100';
	let hydrated = false;
	let selectedTemplateId: string | null = null;

	let steps: Array<{ id: number; percentage: string }> = buildSetStepsFromTemplate(DEFAULT_PERCENTAGES);
	let nextId = DEFAULT_PERCENTAGES.length + 1;

	onMount(async () => {
		const state = await loadCalculatorState();
		selectedBar = state.preferences.preferredBarWeight;
		oneRmValue = state.sets.oneRm;
		applyBarTheme(selectedBar);
		hydrated = true;
	});

	$: parsedOneRm = Number.parseFloat(oneRmValue.replace(',', '.'));

	let computedSteps: ReturnType<typeof computeSmartSetSequence>;
	$: {
		if (!Number.isFinite(parsedOneRm) || parsedOneRm <= selectedBar) {
			computedSteps = [];
		} else {
			computedSteps = computeSmartSetSequence(steps, selectedBar, parsedOneRm);
		}
	}

	$: if (selectedTemplateId) {
		const template = SET_TEMPLATES.find((item) => item.id === selectedTemplateId);

		if (template?.buildSteps) {
			const nextSteps = template.buildSteps(parsedOneRm, selectedBar);
			const changed =
				nextSteps.length !== steps.length ||
				nextSteps.some((step, index) => step.percentage !== steps[index]?.percentage);

			if (changed) {
				steps = nextSteps;
				nextId = nextSteps.length + 1;
			}
		}
	}

	$: if (browser && hydrated) {
		applyBarTheme(selectedBar);
		void saveSetsState({
			barWeight: selectedBar,
			oneRm: oneRmValue
		});
	}

	function addStep() {
		triggerHaptic();
		if (steps.length >= MAX_STEPS) return;
		selectedTemplateId = null;
		steps = [...steps, { id: nextId++, percentage: '' }];
	}

	function removeStep(id: number) {
		selectedTemplateId = null;
		steps = steps.filter((s) => s.id !== id);
	}

	function updatePercentage(id: number, value: string) {
		selectedTemplateId = null;
		steps = steps.map((s) => (s.id === id ? { ...s, percentage: value } : s));
	}

	function applyTemplate(template: SetTemplate) {
		triggerHaptic();
		const nextSteps = template.buildSteps
			? template.buildSteps(parsedOneRm, selectedBar)
			: buildSetStepsFromTemplate(template.percentages ?? []);

		steps = nextSteps;
		nextId = nextSteps.length + 1;
		selectedTemplateId = template.id;
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
		<div class="setup-field">
			<BarSelector
				value={selectedBar}
				onChange={(v) => (selectedBar = v)}
				label="Bar"
				helper=""
				subtle={true}
				showText={false}
			/>
		</div>

		<div class="orm-block">
			<p class="orm-label">1 Rep Max</p>

			<PercentageStepper
				value={oneRmValue}
				label="One rep max in kilograms"
				unit="kg"
				placeholder="100"
				step={2.5}
				min={0}
				max={500}
				decrementLabel="Decrease one rep max by 2.5 kilograms"
				incrementLabel="Increase one rep max by 2.5 kilograms"
				onChange={(value) => (oneRmValue = value)}
			/>
		</div>

		<div class="template-strip" role="group" aria-label="Training set presets">
			<p class="template-strip__label">Warm-up presets</p>
			<div class="template-strip__buttons">
				{#each SET_TEMPLATES as template (template.id)}
					<button
						type="button"
						class:template-btn--selected={selectedTemplateId === template.id}
						class="template-btn"
						onclick={() => applyTemplate(template)}
					>
						<span>{template.label}</span>
					</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- Steps list -->
	<div class="steps-list">
		{#each steps as step, stepIndex (step.id)}
			{@const computed = computedSteps.find((c) => c.id === step.id)}
			<div class="step-card"
				class:step-card--resolved={computed?.result.status === 'exact' || computed?.result.status === 'rounded'}
				in:fly={{ y: 20, duration: 220, easing: cubicOut }}
				out:scale={{ duration: 160, start: 0.94 }}
				animate:flip={{ duration: 280, easing: cubicOut }}
			>
				<!-- Step header -->
				<div class="step-card__header">
					<div class="step-card__meta">
						<span class="step-label">Set {stepIndex + 1}</span>
						{#if computed}
							<span class="step-weight weight-display"
								>{formatWeight(
									computed.result.resolvedTotal ?? computed.result.requestedTotal
								)}</span
							>
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
							{#if computed.upWeightMoveCost > 0}
								<span class="diff-pill diff-pill--moves">
									<span class="material-symbols-rounded" aria-hidden="true">swap_vert</span>
									{computed.upWeightMoveCost} {computed.upWeightMoveCost === 1 ? 'move' : 'moves'} to load
								</span>
							{/if}
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
						realistic={true}
						emptyMessage="Empty bar — no plates needed."
						emptyHint="Use a warm-up preset or enter a percentage to preview plates for this set."
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
			<md-outlined-button class="add-step-btn" onclick={addStep}>
				<span slot="icon" class="material-symbols-rounded" aria-hidden="true">add</span>
				Add set
			</md-outlined-button>
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

	.setup-field {
		display: grid;
		gap: 0.35rem;
	}

	.orm-block {
		display: grid;
		gap: 0.65rem;
	}

	.template-strip {
		display: grid;
		gap: 0.75rem;
		padding-top: 0.15rem;
	}

	.template-strip__label {
		margin: 0;
		font-size: var(--type-body-sm);
		font-weight: 700;
		color: var(--text-primary);
	}

	.template-strip__buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 0.45rem;
	}

	.template-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.68rem 0.8rem;
		border-radius: 999px;
		border: 1px solid var(--outline);
		background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 84%, transparent);
		text-align: center;
		cursor: pointer;
		transition:
			transform 120ms cubic-bezier(0.2, 0, 0, 1),
			background 120ms cubic-bezier(0.2, 0, 0, 1),
			border-color 120ms cubic-bezier(0.2, 0, 0, 1),
			box-shadow 180ms cubic-bezier(0.2, 0, 0, 1);
	}

	.template-btn span {
		font-family: 'Archivo', sans-serif;
		font-size: 0.96rem;
		font-weight: 800;
		letter-spacing: var(--tracking-tight);
		color: var(--text-primary);
	}

	.template-btn:hover {
		background: color-mix(in srgb, var(--tone-secondary-surface) 72%, white 28%);
		border-color: var(--tone-secondary-border);
	}

	.template-btn:active {
		transform: scale(0.98);
	}

	.template-btn--selected {
		background: color-mix(in srgb, var(--tone-secondary-surface) 78%, white 22%);
		border-color: var(--tone-secondary-border);
		box-shadow: 0 10px 22px color-mix(in srgb, var(--accent-secondary) 16%, transparent);
	}

	.orm-label {
		margin: 0;
		font-size: var(--type-body-sm);
		font-weight: 700;
		color: var(--text-primary);
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

	.step-card--resolved {
		box-shadow: var(--shadow), inset 3px 0 0 var(--accent-secondary);
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

	.diff-pill--moves {
		background: color-mix(in srgb, var(--tone-tertiary-surface) 78%, white 22%);
		color: var(--tone-tertiary-text);
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
	:global(md-outlined-button.add-step-btn) {
		width: 100%;
		--md-outlined-button-container-shape: var(--radius-xl);
		--md-outlined-button-container-height: 3.2rem;
	}

	@media (max-width: 40rem) {
		.setup-card,
		.step-card {
			padding: 1rem;
			box-shadow: none;
		}

		.template-strip {
			gap: 0.5rem;
		}

		.template-strip__buttons {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.step-card__header {
			flex-direction: column;
			align-items: stretch;
		}

		.step-card__meta {
			justify-content: space-between;
		}

		.step-card__controls {
			width: 100%;
		}
	}
</style>
