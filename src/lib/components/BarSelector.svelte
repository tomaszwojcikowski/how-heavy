<script lang="ts">
	import type { BarWeight } from '$lib/types/gym';
	import { BAR_OPTIONS } from '$lib/utils/plates';

	export let label = 'Bar weight';
	export let value: BarWeight = 20;
	export let onChange: (nextValue: BarWeight) => void = () => {};
</script>

<div class="bar-selector" aria-label={label}>
	<p>{label}</p>
	<div class="bar-selector__choices" role="radiogroup" aria-label={label}>
		{#each BAR_OPTIONS as option (option)}
			<button
				type="button"
				class:selected={option === value}
				role="radio"
				aria-checked={option === value}
				onclick={() => onChange(option)}
			>
				<span>{option}</span>
				<small>kg bar</small>
			</button>
		{/each}
	</div>
</div>

<style>
	.bar-selector {
		display: grid;
		gap: 0.85rem;
	}

	p {
		margin: 0;
		font-weight: 700;
		color: var(--ink-soft);
	}

	.bar-selector__choices {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	button {
		border: 1px solid var(--outline);
		background: rgba(255, 255, 255, 0.65);
		border-radius: 1.25rem;
		padding: 0.9rem 1rem;
		display: grid;
		gap: 0.15rem;
		justify-items: start;
		font: inherit;
		cursor: pointer;
		transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
	}

	button span {
		font-family: 'Archivo', sans-serif;
		font-size: 1.4rem;
	}

	button small {
		font-size: 0.82rem;
		color: var(--ink-soft);
	}

	button.selected {
		background: linear-gradient(135deg, rgba(255, 111, 60, 0.18), rgba(15, 157, 135, 0.18));
		border-color: rgba(255, 111, 60, 0.45);
		box-shadow: 0 12px 22px rgba(255, 111, 60, 0.16);
		transform: translateY(-1px);
	}
</style>