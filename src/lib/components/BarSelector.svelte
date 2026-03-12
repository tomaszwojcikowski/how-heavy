<script lang="ts">
	import type { BarWeight } from '$lib/types/gym';
	import { BAR_OPTIONS } from '$lib/utils/plates';
	import { triggerHaptic } from '$lib/utils/haptics';

	export let label = 'Bar weight';
	export let helper = 'Saved across the app.';
	export let subtle = false;
	export let showText = true;
	export let value: BarWeight = 20;
	export let onChange: (nextValue: BarWeight) => void = () => {};

	function handleChange(nextValue: BarWeight) {
		triggerHaptic();
		onChange(nextValue);
	}
</script>

<div class:bar-selector--subtle={subtle} class="bar-selector" role="group" aria-label={label}>
		{#if showText}
			<div class="bar-selector__copy">
				<p class="bar-selector__label">{label}</p>
				{#if helper}
					<p class="bar-selector__helper">{helper}</p>
				{/if}
			</div>
		{/if}
	<div class="bar-selector__options">
		{#each BAR_OPTIONS as option (option)}
			<button
				type="button"
				class:bar-option--15={option === 15}
				class:bar-option--20={option === 20}
				class:bar-option--selected={option === value}
				class="bar-option"
				onclick={() => handleChange(option)}
				aria-pressed={option === value}
			>
				<span class="bar-option__theme-dot" aria-hidden="true"></span>
				<span class="bar-option__weight">{option}</span>
				<span class="bar-option__unit">kg</span>
				<md-ripple></md-ripple>
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
		gap: 0.35rem;
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
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0;
		border-radius: 16px;
		border: 1px solid var(--border-subtle);
		background: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 84%, transparent);
		box-shadow: var(--shadow-mobile);
		overflow: hidden;
	}

	.bar-option {
		display: inline-flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.22rem;
		min-width: 0;
		width: 100%;
		padding: 0.7rem 0.85rem;
		border: 0;
		background: transparent;
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

	.bar-option + .bar-option {
		border-left: 1px solid var(--border-subtle);
	}

	.bar-option__theme-dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		flex-shrink: 0;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
	}

	.bar-option--20 .bar-option__theme-dot {
		background: #1565c0;
	}

	.bar-option--15 .bar-option__theme-dot {
		background: #c2185b;
	}

	.bar-option:hover {
		background: color-mix(in srgb, var(--surface-card-strong) 74%, transparent);
		color: var(--text-primary);
	}

	.bar-option--selected {
		background: color-mix(in srgb, var(--tone-tertiary-surface) 82%, white 18%);
		color: var(--text-primary);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.42),
			inset 0 0 0 1px color-mix(in srgb, var(--accent-primary) 24%, transparent);
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
		padding: 0.5rem 0.68rem;
	}

	.bar-selector--subtle .bar-option__weight {
		font-size: 0.94rem;
	}

	.bar-selector--subtle .bar-selector__options {
		border-radius: 14px;
	}

	@media (min-width: 48rem) and (max-width: 61.99rem) {
		.bar-selector {
			gap: 0.65rem;
		}

		.bar-option {
			padding: 0.64rem 0.72rem;
		}

		.bar-option__weight {
			font-size: 0.96rem;
		}

		.bar-selector--subtle .bar-option {
			padding: 0.52rem 0.62rem;
		}
	}

	@media (max-width: 40rem) {
		.bar-selector {
			gap: 0.6rem;
		}

		.bar-selector__helper {
			font-size: 0.74rem;
		}

		.bar-option {
			padding: 0.62rem 0.72rem;
		}
	}
</style>