<script lang="ts">
	export let value: string = '';
	export let onChange: (value: string) => void;
	export let onRemove: (() => void) | null = null;
	export let removeLabel: string = 'Remove';
	export let label: string = 'Percentage';
	export let step: number = 5;
	export let min: number = 1;
	export let max: number = 200;

	function increment() {
		const current = Number.parseFloat(value);
		const base = Number.isFinite(current) ? current : 0;
		const next = Math.min(max, base + step);
		onChange(String(next));
	}

	function decrement() {
		const current = Number.parseFloat(value);
		const base = Number.isFinite(current) ? current : 0;
		const next = Math.max(min, base - step);
		onChange(String(next));
	}

	function handleInput(e: Event) {
		onChange((e.currentTarget as HTMLInputElement).value);
	}
</script>

<div class="pct-stepper-row">
	<div class="pct-stepper" role="group" aria-label={label}>
		<button
			type="button"
			class="stepper-btn"
			onclick={decrement}
			aria-label="Decrease percentage"
			tabindex="0"
		>
			<span class="material-symbols-rounded" aria-hidden="true">remove</span>
		</button>

		<div class="stepper-value">
			<input
				type="number"
				inputmode="decimal"
				class="stepper-input"
				{value}
				{min}
				{max}
				placeholder="80"
				oninput={handleInput}
				aria-label={label}
			/>
			<span class="stepper-unit" aria-hidden="true">%</span>
		</div>

		<button
			type="button"
			class="stepper-btn"
			onclick={increment}
			aria-label="Increase percentage"
			tabindex="0"
		>
			<span class="material-symbols-rounded" aria-hidden="true">add</span>
		</button>
	</div>

	{#if onRemove}
		<button
			type="button"
			class="remove-btn"
			onclick={onRemove}
			aria-label={removeLabel}
		>
			<span class="material-symbols-rounded" aria-hidden="true">close</span>
		</button>
	{/if}
</div>

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
		height: 2.4rem;
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

	/* ── Stepper buttons ── */
	.stepper-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.1rem;
		flex-shrink: 0;
		border: none;
		background: var(--md-sys-color-surface-container-low);
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 120ms cubic-bezier(0.2, 0, 0, 1), color 120ms cubic-bezier(0.2, 0, 0, 1);
		position: relative;
		overflow: hidden;
	}

	.stepper-btn:first-child {
		border-right: 1.5px solid var(--outline);
	}

	.stepper-btn:last-child {
		border-left: 1.5px solid var(--outline);
	}

	.stepper-btn:hover {
		background: var(--tone-primary-surface);
		color: var(--tone-primary-text);
	}

	.stepper-btn:active {
		background: color-mix(in srgb, var(--md-sys-color-primary) 18%, var(--md-sys-color-surface-container-low));
	}

	.stepper-btn .material-symbols-rounded {
		font-size: 1.1rem;
		font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 20;
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
	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.1rem;
		height: 2.1rem;
		border-radius: 50%;
		border: 1.5px solid var(--outline);
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 120ms cubic-bezier(0.2, 0, 0, 1), color 120ms cubic-bezier(0.2, 0, 0, 1), border-color 120ms cubic-bezier(0.2, 0, 0, 1);
	}

	.remove-btn:hover {
		background: var(--tone-primary-surface);
		color: var(--tone-primary-text);
		border-color: var(--tone-primary-border);
	}

	.remove-btn .material-symbols-rounded {
		font-size: 1rem;
		font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20;
	}
</style>
