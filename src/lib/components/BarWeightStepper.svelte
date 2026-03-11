<script lang="ts">
	import type { BarWeight } from '$lib/types/gym';

	export let value: BarWeight = 20;
	export let label: string = 'Bar weight';
	export let onChange: (value: BarWeight) => void;

	function increment() {
		onChange(20);
	}

	function decrement() {
		onChange(15);
	}
</script>

<div class="bar-stepper" role="group" aria-label={label}>
	<md-icon-button
		class="stepper-btn"
		onclick={decrement}
		aria-label="Switch to 15 kilogram bar"
		disabled={value === 15}
	>
		<span class="material-symbols-rounded" aria-hidden="true">remove</span>
	</md-icon-button>

	<div class="stepper-value stepper-value--bar">
		<span class="stepper-label">{label}</span>
		<strong class="stepper-number">{value}</strong>
		<span class="stepper-unit" aria-hidden="true">kg</span>
		<span class="stepper-caption">{value === 20 ? 'Blue theme' : 'Pink theme'}</span>
	</div>

	<md-icon-button
		class="stepper-btn"
		onclick={increment}
		aria-label="Switch to 20 kilogram bar"
		disabled={value === 20}
	>
		<span class="material-symbols-rounded" aria-hidden="true">add</span>
	</md-icon-button>
</div>

<style>
	.bar-stepper {
		display: flex;
		align-items: stretch;
		min-height: 4rem;
		border-radius: 14px;
		border: 1.5px solid var(--outline);
		background: var(--md-sys-color-surface-container-lowest);
		overflow: hidden;
		transition:
			border-color 120ms cubic-bezier(0.2, 0, 0, 1),
			box-shadow 120ms cubic-bezier(0.2, 0, 0, 1);
	}

	.bar-stepper:focus-within {
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
	}

	.stepper-btn {
		/* replaced by :global below */
	}

	:global(.bar-stepper md-icon-button.stepper-btn) {
		--md-icon-button-state-layer-shape: 0;
		--md-icon-button-state-layer-height: 4rem;
		--md-icon-button-state-layer-width: 3rem;
		--md-icon-button-icon-size: 1.1rem;
		--md-icon-button-icon-color: var(--text-secondary);
		--md-icon-button-hover-icon-color: var(--md-sys-color-primary);
		--md-icon-button-pressed-icon-color: var(--md-sys-color-primary);
		--md-icon-button-disabled-icon-opacity: 0.48;
		width: 3rem;
		height: 4rem;
		flex-shrink: 0;
		background: var(--md-sys-color-surface-container-low);
	}

	:global(.bar-stepper md-icon-button.stepper-btn:first-child) {
		border-right: 1.5px solid var(--outline);
	}

	:global(.bar-stepper md-icon-button.stepper-btn:last-child) {
		border-left: 1.5px solid var(--outline);
	}

	.stepper-value {
		position: relative;
		display: grid;
		place-items: center;
		flex: 1;
		padding: 0.55rem 2rem 0.6rem;
		text-align: center;
	}

	.stepper-value--bar {
		background: var(--texture-noise-muted), var(--tone-tertiary-surface);
	}

	.stepper-label {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.stepper-number {
		font-family: 'Archivo', sans-serif;
		font-size: 1.4rem;
		line-height: 1;
		font-weight: 800;
		color: var(--text-primary);
	}

	.stepper-unit {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-tertiary);
		pointer-events: none;
		line-height: 1;
	}

	.stepper-caption {
		font-size: 0.74rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
</style>