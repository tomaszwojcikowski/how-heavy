<script lang="ts">
	import type { BarWeight } from '$lib/types/gym';
	import { BAR_OPTIONS } from '$lib/utils/plates';

	export let label = 'Bar weight';
	export let value: BarWeight = 20;
	export let onChange: (nextValue: BarWeight) => void = () => {};
</script>

<div class="bar-selector" role="group" aria-label={label}>
	<p class="bar-selector__label">{label}</p>
	<md-segmented-button-set>
		{#each BAR_OPTIONS as option (option)}
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<md-segmented-button
				label="{option} kg bar"
				selected={option === value}
				onclick={() => onChange(option)}
			></md-segmented-button>
		{/each}
	</md-segmented-button-set>
</div>

<style>
	.bar-selector {
		display: grid;
		gap: 0.85rem;
	}

	.bar-selector__label {
		margin: 0;
		font-weight: 700;
		color: var(--text-primary);
	}

	md-segmented-button-set {
		width: 100%;
	}
</style>