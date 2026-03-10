<script lang="ts">
	export let value = '';
	export let label = 'Target total';
	export let helper = 'Use presets or type a total weight';
	export let presets: number[] = [];
	export let onValueChange: (nextValue: string) => void = () => {};

	function applyPreset(preset: number) {
		onValueChange(String(preset));
	}
</script>

<div class="weight-keypad">
	<label>
		<span>{label}</span>
		<input
			type="number"
			min="0"
			step="0.25"
			inputmode="decimal"
			placeholder="100"
			value={value}
			oninput={(event) => onValueChange((event.currentTarget as HTMLInputElement).value)}
		/>
	</label>

	<p>{helper}</p>

	<div class="weight-keypad__presets" aria-label="Common target presets">
		{#each presets as preset (preset)}
			<button type="button" onclick={() => applyPreset(preset)}>{preset} kg</button>
		{/each}
	</div>
</div>

<style>
	.weight-keypad {
		display: grid;
		gap: 0.85rem;
	}

	label {
		display: grid;
		gap: 0.55rem;
	}

	span {
		font-weight: 700;
		color: var(--ink-soft);
	}

	input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--outline);
		background: rgba(255, 255, 255, 0.72);
		border-radius: 8px;
		padding: 1rem 1.1rem;
		font: inherit;
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--ink-strong);
	}

	p {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.94rem;
	}

	.weight-keypad__presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	button {
		border: 1px solid var(--outline);
		background: rgba(255, 255, 255, 0.7);
		border-radius: 8px;
		padding: 0.7rem 0.95rem;
		font: inherit;
		font-weight: 700;
		color: var(--ink-strong);
		cursor: pointer;
	}
</style>