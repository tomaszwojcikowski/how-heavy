<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import PlatePicker from '$lib/components/PlatePicker.svelte';
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { modeDescriptions, modeLabels } from '$lib/site';
	import { loadCalculatorState, saveCurrentState } from '$lib/stores/calculator';
	import type { BarWeight, PlateWeight } from '$lib/types/gym';
	import { calculateCurrentLoad, summarizePlateCounts } from '$lib/utils/calculations';
	import { formatWeight } from '$lib/utils/formatting';
	import { getMaxPlateCountPerSide } from '$lib/utils/plates';
	import { applyBarTheme } from '$lib/utils/theme';
	import { triggerHaptic } from '$lib/utils/haptics';

	const QUICK_PRESETS: { label: string; icon: string; plates: PlateWeight[] }[] = [
		{ label: 'Empty bar', icon: 'fitness_center', plates: [] },
		{ label: '1 plate/side', icon: 'looks_one', plates: [20] },
		{ label: '2 plates/side', icon: 'looks_two', plates: [20, 20] }
	];

	let selectedBar: BarWeight = 20;
	let oneSidePlates: PlateWeight[] = [];
	let hydrated = false;
	let clearPending = false;
	let undoMessage = '';
	let undoPlates: PlateWeight[] | null = null;
	let clearResetTimeout: ReturnType<typeof setTimeout> | null = null;
	let undoTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		const state = await loadCalculatorState();
		selectedBar = state.preferences.preferredBarWeight;
		oneSidePlates = state.current.plates;
		applyBarTheme(selectedBar);
		hydrated = true;
	});

	$: summary = calculateCurrentLoad(selectedBar, oneSidePlates);
	$: groupedPlates = summarizePlateCounts(oneSidePlates);
	$: showStickyPlateSummary = oneSidePlates.length >= 3;
	$: if (browser && hydrated) {
		applyBarTheme(selectedBar);
		void saveCurrentState({
			barWeight: selectedBar,
			plates: oneSidePlates
		});
	}

	onDestroy(() => {
		if (clearResetTimeout) {
			clearTimeout(clearResetTimeout);
		}

		if (undoTimeout) {
			clearTimeout(undoTimeout);
		}
	});

	function queueUndo(message: string, previousPlates: PlateWeight[]) {
		undoMessage = message;
		undoPlates = previousPlates;

		if (undoTimeout) {
			clearTimeout(undoTimeout);
		}

		undoTimeout = setTimeout(() => {
			undoMessage = '';
			undoPlates = null;
		}, 4500);
	}

	function resetClearIntent() {
		clearPending = false;

		if (clearResetTimeout) {
			clearTimeout(clearResetTimeout);
			clearResetTimeout = null;
		}
	}

	function stageClearIntent() {
		triggerHaptic();
		clearPending = true;

		if (clearResetTimeout) {
			clearTimeout(clearResetTimeout);
		}

		clearResetTimeout = setTimeout(() => {
			clearPending = false;
			clearResetTimeout = null;
		}, 3000);
	}

	function applyPlateChange(nextPlates: PlateWeight[], message: string) {
		triggerHaptic();
		const previousPlates = oneSidePlates;
		oneSidePlates = nextPlates;
		resetClearIntent();
		queueUndo(message, previousPlates);
	}

	function addPlate(weight: PlateWeight) {
		const samePlateCount = oneSidePlates.filter((plate) => plate === weight).length;

		if (samePlateCount >= getMaxPlateCountPerSide(weight)) {
			return;
		}

		applyPlateChange([...oneSidePlates, weight], `Added ${formatWeight(weight)} plate.`);
	}

	function removePlate(weight: PlateWeight) {
		const plateIndex = oneSidePlates.lastIndexOf(weight);

		if (plateIndex < 0) {
			return;
		}

		applyPlateChange(oneSidePlates.toSpliced(plateIndex, 1), `Removed ${formatWeight(weight)} plate.`);
	}

	function clearAll() {
		if (oneSidePlates.length === 0) {
			return;
		}

		if (!clearPending) {
			stageClearIntent();
			return;
		}

		applyPlateChange([], 'Cleared all plates.');
	}

	function undoLastChange() {
		if (!undoPlates) {
			return;
		}

		oneSidePlates = undoPlates;
		undoMessage = '';
		undoPlates = null;

		if (undoTimeout) {
			clearTimeout(undoTimeout);
			undoTimeout = null;
		}
	}

	function formatPlateChip(weight: PlateWeight, count: number) {
		return `${count}×${weight}`;
	}
</script>

<svelte:head>
	<title>How Heavy | {modeLabels.countPlates}</title>
</svelte:head>

<section class="calculator-shell">
	{#if hydrated}
		<header class="page-header">
			<p class="eyebrow">{modeLabels.countPlates}</p>
			<p class="page-header__desc">{modeDescriptions.countPlates}</p>
		</header>

		<!-- Sticky total strip — always visible as user taps plates -->
		<div class="totals-strip" aria-live="polite" aria-label="Running total">
			<strong class="totals-strip__weight weight-display">{formatWeight(summary.totalWeight)}</strong>
			<div class="totals-strip__meta">
				<span class="totals-strip__label">Total</span>
				<span class="sep">·</span>
				<span class="totals-strip__label">Side</span>
				<strong class="totals-strip__value weight-display">{formatWeight(summary.oneSideWeight)}</strong>
				<span class="sep">·</span>
				<span class="totals-strip__label weight-display">{formatWeight(summary.barWeight)}</span>
			</div>
			{#if showStickyPlateSummary}
				<div class="totals-strip__chips" aria-label="Plate summary per side">
					{#each groupedPlates as plate (plate.weight)}
						<span class="totals-strip__chip">{formatPlateChip(plate.weight, plate.count)}</span>
					{/each}
					<span class="totals-strip__chip totals-strip__chip--meta">/ side</span>
				</div>
			{/if}
		</div>

		<!-- Controls: bar selector + plate picker -->
		<section class="control-card">
			<div class="control-header">
				<BarSelector
					bind:value={selectedBar}
					onChange={(nextValue) => (selectedBar = nextValue)}
					label="Bar"
					helper=""
					subtle={true}
					showText={false}
				/>
				<md-outlined-button
					class="clear-btn"
					class:clear-btn--confirm={clearPending}
					onclick={clearAll}
					disabled={oneSidePlates.length === 0}
				>
					{clearPending ? 'Tap again to clear' : 'Clear'}
				</md-outlined-button>
			</div>

			<div class="preset-strip" role="group" aria-label="Quick setup presets">
				{#each QUICK_PRESETS as preset (preset.label)}
					<md-suggestion-chip
						class="preset-btn"
						label={preset.label}
						onclick={() => applyPlateChange([...preset.plates], `Loaded: ${preset.label}.`)}
					>
						<span slot="icon" class="material-symbols-rounded" aria-hidden="true">{preset.icon}</span>
					</md-suggestion-chip>
				{/each}
			</div>

			<p class="mirror-note" role="note" aria-label="Mirrored plate loading">
				<span class="material-symbols-rounded" aria-hidden="true">compare_arrows</span>
				<span>Pick one side only. The other side matches automatically.</span>
			</p>

			<PlatePicker selectedPlates={oneSidePlates} onAdd={addPlate} onRemove={removePlate} />
		</section>

		<!-- Barbell visualization — below the fold, scroll to see -->
		<section class="viz-card">
			<PlateStackPreview
				barWeight={summary.barWeight}
				plates={groupedPlates}
				onRemovePlate={removePlate}
				emptyMessage="Tap plates above or load a preset to build the bar."
				emptyHint="You only need to pick one side."
			/>
		</section>

		{#if undoMessage}
			<div class="undo-toast" role="status" aria-live="polite">
				<span>{undoMessage}</span>
				<button type="button" class="undo-toast__button" onclick={undoLastChange}>Undo</button>
			</div>
		{/if}
	{:else}
		<div class="totals-strip loading-card" aria-busy="true" aria-label="Loading saved current setup">
			<div class="loading-line" style="width: 34%; height: 2.8rem"></div>
			<div class="loading-line" style="width: 72%"></div>
		</div>

		<section class="control-card loading-card">
			<div class="loading-grid">
				<div class="loading-pill"></div>
				<div class="loading-pill"></div>
			</div>
			<div class="loading-grid loading-grid--3">
				<div class="loading-block"></div>
				<div class="loading-block"></div>
				<div class="loading-block"></div>
				<div class="loading-block"></div>
				<div class="loading-block"></div>
				<div class="loading-block"></div>
			</div>
		</section>

		<section class="viz-card loading-card">
			<div class="loading-line" style="width: 42%"></div>
			<div class="loading-block" style="height: 10rem"></div>
		</section>
	{/if}
</section>

<style>
	.calculator-shell {
		display: grid;
		gap: 0.85rem;
	}

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

	/* Sticky total pill — follows the user as they scroll the plate picker */
	.totals-strip {
		position: sticky;
		top: 0.5rem;
		z-index: 5;
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0.85rem 1.2rem;
		background: color-mix(in srgb, var(--surface-1) 92%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
		flex-wrap: wrap;
	}

	.totals-strip__weight {
		font-family: 'Archivo', sans-serif;
		font-size: clamp(1.8rem, 5vw, 2.4rem);
		line-height: 1;
		color: var(--text-primary);
	}

	.totals-strip__meta {
		display: flex;
		gap: 0.45rem;
		align-items: center;
		color: var(--text-secondary);
		font-size: 0.88rem;
		line-height: 1.24;
		letter-spacing: var(--tracking-body);
		flex-wrap: wrap;
	}

	.totals-strip__chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		width: 100%;
	}

	.totals-strip__chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.28rem 0.58rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 84%, transparent);
		border: 1px solid color-mix(in srgb, var(--outline) 78%, transparent);
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-secondary);
	}

	.totals-strip__chip--meta {
		background: transparent;
		border-style: dashed;
		color: var(--text-tertiary);
	}

	.totals-strip__label {
		color: var(--text-tertiary);
		font-size: var(--type-label);
		text-transform: uppercase;
		letter-spacing: var(--tracking-label);
	}

	.totals-strip__value {
		color: var(--text-primary);
		font-family: 'Archivo', sans-serif;
		font-size: 1rem;
	}

	.sep {
		opacity: 0.35;
	}

	.control-card,
	.viz-card {
		display: grid;
		gap: 1.1rem;
		padding: 1.2rem;
		background: var(--surface-1);
		border: 1px solid var(--outline);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow);
	}

	.control-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.preset-strip {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	:global(md-suggestion-chip.preset-btn [slot='icon']) {
		font-size: 1rem;
		font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
	}

	:global(md-outlined-button.clear-btn) {
		flex-shrink: 0;
		--md-outlined-button-container-shape: 8px;
	}

	:global(md-outlined-button.clear-btn.clear-btn--confirm) {
		--md-outlined-button-label-text-color: var(--tone-primary-text);
		--md-outlined-button-hover-label-text-color: var(--tone-primary-text);
		--md-outlined-button-focus-label-text-color: var(--tone-primary-text);
		--md-outlined-button-pressed-label-text-color: var(--tone-primary-text);
		--md-outlined-button-outline-color: var(--tone-primary-border);
		--md-outlined-button-hover-outline-color: var(--tone-primary-border);
		--md-outlined-button-focus-outline-color: var(--tone-primary-border);
	}

	.mirror-note {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		margin: 0;
		font-size: 0.84rem;
		line-height: 1.35;
		color: var(--text-secondary);
	}

	.mirror-note .material-symbols-rounded {
		font-size: 1rem;
		color: var(--tone-secondary-text);
		margin-top: 0.08rem;
		flex-shrink: 0;
	}

	.undo-toast {
		position: fixed;
		left: 50%;
		bottom: calc(5.8rem + env(safe-area-inset-bottom, 0px));
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.9rem;
		width: min(calc(100vw - 2rem), 28rem);
		padding: 0.9rem 1rem;
		border-radius: 8px;
		background: var(--md-sys-color-inverse-surface);
		color: var(--md-sys-color-inverse-on-surface);
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
		z-index: 11;
	}

	.undo-toast__button {
		margin-left: auto;
		padding: 0.5rem 0.8rem;
		border-radius: 6px;
		border: 1px solid color-mix(in srgb, var(--md-sys-color-inverse-on-surface) 18%, transparent);
		background: color-mix(in srgb, var(--md-sys-color-inverse-on-surface) 10%, transparent);
		color: inherit;
		cursor: pointer;
		font-weight: 700;
	}

	@media (min-width: 62rem) {
		/* On desktop: controls left, (total + viz) right as a side panel */
		.calculator-shell {
			grid-template-columns: minmax(22rem, 1.2fr) minmax(0, 0.8fr);
			grid-template-rows: auto 1fr;
			align-items: start;
		}

		.totals-strip {
			grid-column: 2;
			grid-row: 1;
		}

		.control-card {
			grid-column: 1;
			grid-row: 1 / 3;
		}

		.viz-card {
			grid-column: 2;
			grid-row: 2;
		}
	}

	@media (max-width: 40rem) {
		.totals-strip {
			top: 0;
			padding: 0.75rem 0.9rem;
			gap: 0.55rem;
			border-radius: 14px;
			box-shadow: none;
		}

		.totals-strip__meta {
			width: 100%;
			gap: 0.35rem;
			font-size: 0.8rem;
		}

		.totals-strip__chips {
			display: none;
		}

		.control-card,
		.viz-card {
			padding: 1rem;
			gap: 0.9rem;
			box-shadow: none;
		}

		.control-header {
			display: flex;
			justify-content: space-between;
			align-items: stretch;
		}

		.preset-strip {
			flex-wrap: nowrap;
			overflow-x: auto;
			padding-bottom: 0.2rem;
			scrollbar-width: none;
		}

		.preset-strip::-webkit-scrollbar {
			display: none;
		}

		.mirror-note {
			font-size: 0.78rem;
		}

		.undo-toast {
			width: calc(100vw - 1rem);
			bottom: calc(5.4rem + env(safe-area-inset-bottom, 0px));
		}
	}
</style>