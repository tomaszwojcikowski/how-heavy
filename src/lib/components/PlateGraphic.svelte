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
	<div class="plate-body" aria-hidden="true"></div>
	<svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} role="img" aria-label={plate.label}>
		<defs>
			<radialGradient id={`plate-gradient-${plate.shortLabel}`} cx="35%" cy="30%">
				<stop offset="0%" stop-color={plate.accentColor} />
				<stop offset="100%" stop-color={plate.color} />
			</radialGradient>
		</defs>

		<circle cx="110" cy="110" r={plate.radius} fill={`url(#plate-gradient-${plate.shortLabel})`} />
		<circle cx="110" cy="110" r={plate.radius - 12} fill="transparent" stroke={plate.accentColor} stroke-width="10" />
		{#if plate.kind === 'bumper'}
			<circle cx="110" cy="110" r={plate.radius - 22} fill="transparent" stroke="#2d2d2d" stroke-width="4" />
			<circle cx="110" cy="110" r={plate.radius - 32} fill="transparent" stroke="#111111" stroke-width="8" />
		{/if}
		<circle cx="110" cy="110" r={plate.ringRadius} fill="#f6efe7" stroke="#d6c6bb" stroke-width="8" />
		<text x="110" y="106" text-anchor="middle">{plate.shortLabel}</text>
		<text x="110" y="132" text-anchor="middle" class="unit">kg</text>
	</svg>

	{#if count > 1}
		<figcaption>x{count}</figcaption>
	{/if}
</figure>

<style>
	figure {
		margin: 0;
		position: relative;
		width: calc(var(--plate-size) + var(--plate-thickness));
		height: var(--plate-size);
		filter: drop-shadow(0 16px 20px rgba(60, 29, 20, 0.16));
	}

	figure.stacked {
		filter: drop-shadow(0 10px 16px rgba(60, 29, 20, 0.2));
	}

	.plate-body,
	svg {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
	}

	.plate-body {
		width: var(--plate-thickness);
		left: calc(100% - var(--plate-thickness));
		border-radius: 0 999px 999px 0;
		background: linear-gradient(180deg, var(--plate-edge), #3a3a3a 42%, var(--plate-edge));
		box-shadow: inset -2px 0 0 rgba(255, 255, 255, 0.06);
	}

	svg {
		width: var(--plate-size);
		height: 100%;
		display: block;
	}

	text {
		font-family: 'Archivo', sans-serif;
		font-size: 30px;
		font-weight: 800;
		fill: var(--plate-text);
		letter-spacing: -0.04em;
	}

	text.unit {
		font-size: 18px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	figcaption {
		position: absolute;
		right: -0.2rem;
		bottom: -0.1rem;
		background: rgba(47, 26, 23, 0.92);
		color: #fffaf5;
		border-radius: 999px;
		padding: 0.28rem 0.5rem;
		font-size: 0.82rem;
		font-weight: 700;
	}

	figure.bumper text {
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.45);
	}
</style>