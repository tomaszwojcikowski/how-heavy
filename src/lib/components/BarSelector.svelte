<script lang="ts">
	import type { BarWeight } from '$lib/types/gym';
	import { BAR_OPTIONS } from '$lib/utils/plates';

	export let label = 'Bar weight';
	export let helper = 'Changing this updates the default across the app.';
	export let subtle = false;
	export let value: BarWeight = 20;
	export let onChange: (nextValue: BarWeight) => void = () => {};
</script>

<div class:bar-selector--subtle={subtle} class="bar-selector" role="group" aria-label={label}>
	<div class="bar-selector__copy">
		<p class="bar-selector__label">{label}</p>
		{#if helper}
			<p class="bar-selector__helper">{helper}</p>
		{/if}
	</div>
	<div class="bar-selector__options">
		{#each BAR_OPTIONS as option (option)}
			<button
				type="button"
				class:bar-option--15={option === 15}
				class:bar-option--20={option === 20}
				class:bar-option--selected={option === value}
				class="bar-option"
				onclick={() => onChange(option)}
				aria-pressed={option === value}
			>
				<span class="bar-option__theme-dot" aria-hidden="true"></span>
				<span class="bar-option__weight">{option}</span>
				<span class="bar-option__unit">kg</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.bar-selector {
		display: grid;
		gap: 0.75rem;
	}

	.bar-selector--subtle {
		gap: 0.55rem;
	}

	.bar-selector__copy {
		display: grid;
		gap: 0.2rem;
	}

	.bar-selector__label {
		margin: 0;
		font-size: var(--type-body-sm);
		font-weight: 700;
		color: var(--text-primary);
	}

	.bar-selector__helper {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.35;
		color: var(--text-secondary);
	}

	.bar-selector__options {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.bar-option {
		display: inline-flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.22rem;
		min-width: 4.2rem;
		padding: 0.55rem 0.8rem;
		border-radius: 999px;
		border: 1px solid var(--outline);
		background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 86%, transparent);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background 120ms cubic-bezier(0.2, 0, 0, 1),
			border-color 120ms cubic-bezier(0.2, 0, 0, 1),
			color 120ms cubic-bezier(0.2, 0, 0, 1),
			transform 120ms cubic-bezier(0.2, 0, 0, 1),
			box-shadow 180ms cubic-bezier(0.2, 0, 0, 1);
		position: relative;
		overflow: hidden;
	}

	.bar-option__theme-dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		flex-shrink: 0;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
	}

	.bar-option--20 .bar-option__theme-dot {
		background: linear-gradient(180deg, #4a97ef, #1565c0);
	}

	.bar-option--15 .bar-option__theme-dot {
		background: linear-gradient(180deg, #ef6ba4, #c2185b);
	}

	.bar-option:hover {
		border-color: color-mix(in srgb, var(--accent-primary) 34%, var(--outline));
		color: var(--text-primary);
	}

	.bar-option--selected {
		background: color-mix(in srgb, var(--tone-tertiary-surface) 88%, white 12%);
		border-color: color-mix(in srgb, var(--accent-primary) 26%, transparent);
		color: var(--text-primary);
		box-shadow:
			0 10px 24px color-mix(in srgb, var(--accent-primary) 18%, transparent),
			inset 0 1px 0 rgba(255, 255, 255, 0.42);
		transform: translateY(-1px) scale(1.01);
	}

	.bar-option:active {
		transform: translateY(1px) scale(0.98);
	}

	.bar-option__weight {
		font-family: 'Archivo', sans-serif;
		font-size: 1rem;
		font-weight: 800;
		line-height: 1;
	}

	.bar-option__unit {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.bar-selector--subtle .bar-selector__label {
		font-size: 0.78rem;
		color: var(--text-secondary);
	}

	.bar-selector--subtle .bar-selector__helper {
		font-size: 0.74rem;
	}

	.bar-selector--subtle .bar-option {
		min-width: 3.7rem;
		padding: 0.45rem 0.72rem;
	}

	.bar-selector--subtle .bar-option__weight {
		font-size: 0.94rem;
	}
</style>