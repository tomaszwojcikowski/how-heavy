<script lang="ts">
	import type { PlateWeight } from '$lib/types/gym';
	import { PLATE_MAP } from '$lib/utils/plates';

	export let weight: PlateWeight;
	export let size = 120;
	export let count = 0;
	export let stacked = false;

	const viewBoxSize = 220;

	$: plate = PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP];
</script>

<figure
	class:stacked
	class:bumper={plate.kind === 'bumper'}
	style={`--plate-size:${size}px; --plate-color:${plate.color}; --plate-text:${plate.textColor}; --plate-edge:${plate.edgeColor}; --plate-thickness:${plate.thickness}px;`}
>
	<svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} role="img" aria-label={plate.label}>
		<circle cx="110" cy="110" r={plate.radius} fill={plate.color} />
		<circle cx="110" cy="110" r={plate.radius - 12} fill="transparent" stroke={plate.accentColor} stroke-width="8" />
		{#if plate.kind === 'bumper'}
			<circle cx="110" cy="110" r={plate.radius - 28} fill="transparent" stroke="#2a2a2a" stroke-width="6" />
		{/if}
		<circle cx="110" cy="110" r={plate.ringRadius} fill="#efebe6" stroke="#c9beb4" stroke-width="7" />
	</svg>

	{#if count > 1}
		<figcaption>x{count}</figcaption>
	{/if}
</figure>

<style>
	figure {
		margin: 0;
		position: relative;
		width: var(--plate-size);
		height: var(--plate-size);
		filter: drop-shadow(0 10px 14px rgba(60, 29, 20, 0.12));
	}

	figure.stacked {
		filter: drop-shadow(0 8px 12px rgba(60, 29, 20, 0.14));
	}

	svg {
		height: 100%;
		width: var(--plate-size);
		display: block;
	}

	figcaption {
		position: absolute;
		right: -0.2rem;
		bottom: -0.1rem;
		background: rgba(47, 26, 23, 0.92);
		color: #fffaf5;
		border-radius: 5px;
		padding: 0.28rem 0.5rem;
		font-size: 0.82rem;
		font-weight: 700;
	}

	figure.bumper svg {
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.06));
	}
</style>