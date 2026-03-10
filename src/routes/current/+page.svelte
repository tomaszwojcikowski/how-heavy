<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';

	import BarSelector from '$lib/components/BarSelector.svelte';
	import PlatePicker from '$lib/components/PlatePicker.svelte';
	import PlateStackPreview from '$lib/components/PlateStackPreview.svelte';
	import { modeLabels } from '$lib/site';
	import { loadCalculatorState, saveCurrentState } from '$lib/stores/calculator';
	import type { BarWeight, PlateWeight } from '$lib/types/gym';
	import { calculateCurrentLoad, summarizePlateCounts } from '$lib/utils/calculations';
	import { formatWeight } from '$lib/utils/formatting';

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
		selectedBar = state.current.barWeight;
		oneSidePlates = state.current.plates;
		hydrated = true;
	});

	$: summary = calculateCurrentLoad(selectedBar, oneSidePlates);
	$: groupedPlates = summarizePlateCounts(oneSidePlates);
	$: if (browser && hydrated) {
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
		const previousPlates = oneSidePlates;
		oneSidePlates = nextPlates;
		resetClearIntent();
		queueUndo(message, previousPlates);
	}

	function addPlate(weight: PlateWeight) {
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
</script>

<svelte:head>
	<title>How Heavy | {modeLabels.countPlates}</title>
</svelte:head>

<section class="calculator-shell">
	{#if hydrated}
		<!-- Sticky total strip — always visible as user taps plates -->
		<div class="totals-strip" aria-live="polite" aria-label="Running total">
			<strong class="totals-strip__weight">{formatWeight(summary.totalWeight)}</strong>
			<div class="totals-strip__meta">
				<span>{formatWeight(summary.barWeight)} bar</span>
				<span class="sep">·</span>
				<span>{formatWeight(summary.oneSideWeight)} per side</span>
				<span class="sep">·</span>
				<span>{oneSidePlates.length} plates</span>
			</div>
		</div>

		<!-- Controls: bar selector + plate picker -->
		<section class="control-card">
			<div class="control-header">
				<BarSelector bind:value={selectedBar} onChange={(nextValue) => (selectedBar = nextValue)} label="Active bar" />
				<button
					type="button"
					class:clear-btn--confirm={clearPending}
					class="clear-btn"
					onclick={clearAll}
					disabled={oneSidePlates.length === 0}
				>
					{clearPending ? 'Tap again to clear' : 'Clear'}
				</button>
			</div>

			<PlatePicker selectedPlates={oneSidePlates} onAdd={addPlate} onRemove={removePlate} />
		</section>

		<!-- Barbell visualization — below the fold, scroll to see -->
		<section class="viz-card">
			<PlateStackPreview
				barWeight={summary.barWeight}
				plates={groupedPlates}
				emptyMessage="Tap plates above to build your barbell."
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

	/* Sticky total pill — follows the user as they scroll the plate picker */
	.totals-strip {
		position: sticky;
		top: 0.5rem;
		z-index: 5;
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0.85rem 1.2rem;
		background: rgba(255, 250, 245, 0.92);
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
		color: var(--ink-strong);
	}

	.totals-strip__meta {
		display: flex;
		gap: 0.45rem;
		align-items: center;
		color: var(--ink-muted);
		font-size: 0.88rem;
		flex-wrap: wrap;
	}

	.sep {
		opacity: 0.35;
	}

	.control-card,
	.viz-card {
		display: grid;
		gap: 1.1rem;
		padding: 1.2rem;
		background: rgba(255, 250, 245, 0.88);
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

	.clear-btn {
		flex-shrink: 0;
		border-radius: 8px;
		padding: 0.6rem 1rem;
		font-weight: 700;
		border: 1px solid var(--outline);
		background: var(--surface-4);
		cursor: pointer;
		color: var(--ink-soft);
	}

	.clear-btn:disabled {
		opacity: 0.7;
		color: var(--ink-faint);
		cursor: not-allowed;
	}

	.clear-btn--confirm {
		background: rgba(255, 111, 60, 0.18);
		border-color: rgba(255, 111, 60, 0.36);
		color: #8a3517;
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
		background: rgba(47, 26, 23, 0.95);
		color: #fffaf5;
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
		z-index: 11;
	}

	.undo-toast__button {
		margin-left: auto;
		padding: 0.5rem 0.8rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.1);
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
		.undo-toast {
			width: calc(100vw - 1rem);
			bottom: calc(5.4rem + env(safe-area-inset-bottom, 0px));
		}
	}
</style>