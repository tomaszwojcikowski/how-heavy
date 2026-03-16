<script lang="ts">
	import { onDestroy } from 'svelte';
	import '@material/web/iconbutton/icon-button.js';
	import { triggerHaptic } from '$lib/utils/haptics';
	import NumberPad from '$lib/components/NumberPad.svelte';

	export let value: string = '';
	export let onChange: (value: string) => void;
	export let onRemove: (() => void) | null = null;
	export let removeLabel: string = 'Remove';
	export let label: string = 'Percentage';
	export let step: number = 5;
	export let min: number = 1;
	export let max: number = 200;
	export let unit: string = '%';
	export let placeholder: string = '80';
	export let decrementLabel: string = 'Decrease percentage';
	export let incrementLabel: string = 'Increase percentage';

	let padOpen = false;

	function openPad() {
		triggerHaptic();
		padOpen = true;
	}

	let pulseActive = false;
	let pulseTimeout: ReturnType<typeof setTimeout> | null = null;

	function triggerPulse() {
		triggerHaptic();
		pulseActive = true;

		if (pulseTimeout) {
			clearTimeout(pulseTimeout);
		}

		pulseTimeout = setTimeout(() => {
			pulseActive = false;
			pulseTimeout = null;
		}, 140);
	}

	function increment() {
		const current = Number.parseFloat(value);
		const base = Number.isFinite(current) ? current : 0;
		const next = Math.min(max, base + step);
		triggerPulse();
		onChange(String(next));
	}

	function decrement() {
		const current = Number.parseFloat(value);
		const base = Number.isFinite(current) ? current : 0;
		const next = Math.max(min, base - step);
		triggerPulse();
		onChange(String(next));
	}

	function handleRemove() {
		triggerHaptic();
		if (onRemove) onRemove();
	}

	onDestroy(() => {
		if (pulseTimeout) {
			clearTimeout(pulseTimeout);
		}
	});
</script>

<div class="pct-stepper-row">
	<div class:pct-stepper--pulse={pulseActive} class="pct-stepper" role="group" aria-label={label}>
		<md-icon-button
			class="stepper-btn"
			onclick={decrement}
			aria-label={decrementLabel}
		>
			<span class="material-symbols-rounded" aria-hidden="true">remove</span>
		</md-icon-button>

		<div class="stepper-value">
			<input
				type="text"
				inputmode="none"
				readonly
				class="stepper-input weight-display"
				{value}
				placeholder={placeholder}
				onclick={openPad}
				onfocus={openPad}
				aria-label={label}
			/>
			<span class="stepper-unit" aria-hidden="true">{unit}</span>
		</div>

		<md-icon-button
			class="stepper-btn"
			onclick={increment}
			aria-label={incrementLabel}
		>
			<span class="material-symbols-rounded" aria-hidden="true">add</span>
		</md-icon-button>
	</div>

	{#if onRemove}
		<md-icon-button
			class="remove-btn"
			onclick={handleRemove}
			aria-label={removeLabel}
		>
			<span class="material-symbols-rounded" aria-hidden="true">close</span>
		</md-icon-button>
	{/if}
</div>
<NumberPad
	bind:open={padOpen}
	{value}
	label="Enter {label.toLowerCase()}"
	onSubmit={(val: string) => {
		onChange(val);
	}}
	onClose={() => (padOpen = false)}
/>
<style>
	.pct-stepper-row {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	/* ── Stepper pill ── */
	.pct-stepper {
		display: flex;
		align-items: stretch;
		height: 2.5rem;
		border-radius: 10px;
		border: 1.5px solid var(--outline);
		background: var(--md-sys-color-surface-container-lowest);
		overflow: hidden;
		transition: border-color 120ms cubic-bezier(0.2, 0, 0, 1), box-shadow 120ms cubic-bezier(0.2, 0, 0, 1);
	}

	.pct-stepper:focus-within {
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
	}

	.pct-stepper--pulse {
		transform: scale(0.985);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
	}

	/* ── Icon buttons inside pill ── */
	:global(.pct-stepper md-icon-button.stepper-btn) {
		--md-icon-button-state-layer-shape: 0;
		--md-icon-button-state-layer-height: 2.5rem;
		--md-icon-button-state-layer-width: 2.1rem;
		--md-icon-button-icon-size: 1.1rem;
		--md-icon-button-icon-color: var(--text-secondary);
		--md-icon-button-hover-icon-color: var(--md-sys-color-primary);
		--md-icon-button-pressed-icon-color: var(--md-sys-color-primary);
		width: 2.1rem;
		height: 2.5rem;
		flex-shrink: 0;
		background: var(--md-sys-color-surface-container-low);
	}

	:global(.pct-stepper md-icon-button.stepper-btn:first-child) {
		border-right: 1.5px solid var(--outline);
	}

	:global(.pct-stepper md-icon-button.stepper-btn:last-child) {
		border-left: 1.5px solid var(--outline);
	}

	/* ── Value display ── */
	.stepper-value {
		position: relative;
		display: flex;
		align-items: center;
	}

	.stepper-input {
		width: 4rem;
		height: 100%;
		padding: 0 1.5rem 0 0.5rem;
		border: none;
		background: transparent;
		color: var(--text-primary);
		font-family: 'Archivo', sans-serif;
		font-size: 1.05rem;
		font-weight: 800;
		text-align: center;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.stepper-input::-webkit-inner-spin-button,
	.stepper-input::-webkit-outer-spin-button {
		display: none;
	}

	.stepper-input:focus {
		outline: none;
	}

	.stepper-unit {
		position: absolute;
		right: 0.4rem;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-tertiary);
		pointer-events: none;
		line-height: 1;
	}

	/* ── Remove button ── */
	:global(md-icon-button.remove-btn) {
		--md-icon-button-icon-size: 1rem;
		--md-icon-button-icon-color: var(--text-secondary);
		--md-icon-button-hover-icon-color: var(--md-sys-color-primary);
		--md-icon-button-pressed-icon-color: var(--md-sys-color-primary);
		--md-icon-button-state-layer-color: var(--md-sys-color-primary);
		flex-shrink: 0;
	}
</style>
