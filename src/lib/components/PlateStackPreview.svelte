<script lang="ts">
	import { scale } from 'svelte/transition';

	import PlateGraphic from '$lib/components/PlateGraphic.svelte';
	import type { BarWeight, PlateCount, PlateWeight } from '$lib/types/gym';
	import { formatWeight } from '$lib/utils/formatting';
	import { PLATE_MAP } from '$lib/utils/plates';

	export let barWeight: BarWeight = 20;
	export let plates: PlateCount[] = [];

	$: expandedPlates = plates.flatMap((plate) => Array.from({ length: plate.count }, () => plate.weight));
	$: mirroredLeftPlates = [...expandedPlates].reverse();

	function graphicSize(weight: PlateWeight): number {
		return Math.max(58, Math.round(PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP].radius * 1.2));
	}

	function stackOffset(weight: PlateWeight): number {
		const plate = PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP];
		return Math.max(8, Math.round(plate.thickness * 0.72));
	}
</script>

<div class="stack-shell">
	<div class="stack-heading">
		<p>Bar visualization</p>
		<strong>{formatWeight(barWeight)} bar</strong>
	</div>

	<div class="barbell-visual" aria-label={`Barbell visual with ${formatWeight(barWeight)} bar`}>
		<div class="barbell-shaft" aria-hidden="true"></div>

		<div class="barbell-side barbell-side--left" aria-label="Left side mirrored stack">
			<div class="barbell-sleeve" aria-hidden="true"></div>
			{#each mirroredLeftPlates as weight, index (`left-${weight}-${index}`)}
				<div class="stack-plate" style={`--stack-offset:${index * -stackOffset(weight)}px;`} in:scale={{ duration: 180, start: 0.8 }} out:scale={{ duration: 140, start: 0.85 }}>
					<PlateGraphic {weight} size={graphicSize(weight)} stacked={true} />
				</div>
			{/each}
		</div>

		<div class="barbell-center">
			<div class="barbell-grip" aria-hidden="true"></div>
			<div class="barbell-label">
				<span>{barWeight} kg</span>
				<small>olympic bar</small>
			</div>
		</div>

		<div class="barbell-side barbell-side--right" aria-label="Right side stack">
			<div class="barbell-sleeve" aria-hidden="true"></div>
			{#each expandedPlates as weight, index (`right-${weight}-${index}`)}
				<div class="stack-plate" style={`--stack-offset:${index * -stackOffset(weight)}px;`} in:scale={{ duration: 180, start: 0.8 }} out:scale={{ duration: 140, start: 0.85 }}>
					<PlateGraphic {weight} size={graphicSize(weight)} stacked={true} />
				</div>
			{/each}
		</div>
	</div>

	{#if expandedPlates.length === 0}
		<p>No plates needed. The empty bar already matches.</p>
	{/if}
</div>

<style>
	.stack-shell {
		display: grid;
		gap: 1rem;
	}

	.stack-heading {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: baseline;
	}

	.stack-heading p {
		font-size: 0.78rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.stack-heading strong {
		font-family: 'Archivo', sans-serif;
	}

	.barbell-visual {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: end;
		gap: 0.2rem;
		min-height: 12rem;
		padding: 1.25rem 0.25rem 0.5rem;
		overflow: hidden;
	}

	.barbell-shaft {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 2.45rem;
		width: 100%;
		height: 1rem;
		border-radius: 999px;
		background: linear-gradient(90deg, #9a978f, #e5ded6 45%, #8b887f 100%);
		box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5);
	}

	p {
		margin: 0;
		color: var(--ink-soft);
	}

	.barbell-side {
		display: flex;
		align-items: end;
		min-height: 10rem;
		z-index: 1;
	}

	.barbell-side--left {
		justify-content: flex-end;
	}

	.barbell-side--right {
		justify-content: flex-start;
	}

	.barbell-center {
		display: grid;
		justify-items: center;
		gap: 0.75rem;
		align-self: center;
		padding: 0 0.65rem;
		z-index: 2;
	}

	.barbell-grip {
		width: clamp(5rem, 10vw, 7rem);
		height: 1.6rem;
		border-radius: 999px;
		background:
			repeating-linear-gradient(
				90deg,
				#d5cec5 0,
				#d5cec5 6px,
				#8f877e 6px,
				#8f877e 10px
			),
			linear-gradient(90deg, #bdb5ac, #ece4db 50%, #9a9187);
		box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.55);
	}

	.barbell-label {
		display: grid;
		justify-items: center;
		padding: 0.65rem 0.85rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.78);
		border: 1px solid var(--outline);
	}

	.barbell-label span {
		font-family: 'Archivo', sans-serif;
		font-size: 1rem;
		font-weight: 800;
		color: var(--ink-strong);
	}

	.barbell-label small {
		font-size: 0.74rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-soft);
	}

	.barbell-sleeve {
		width: 0.95rem;
		height: 5.75rem;
		align-self: end;
		border-radius: 999px;
		background: linear-gradient(180deg, #bbb1a7, #f0e7de 45%, #998f86);
		box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5);
	}

	.barbell-side--left .barbell-sleeve {
		order: 999;
		margin-left: 0.2rem;
	}

	.barbell-side--right .barbell-sleeve {
		margin-right: 0.2rem;
	}

	.stack-plate {
		margin-left: var(--stack-offset);
	}

	.barbell-side--left .stack-plate {
		margin-left: 0;
		margin-right: var(--stack-offset);
	}

	@media (max-width: 40rem) {
		.stack-heading {
			display: grid;
			gap: 0.35rem;
		}

		.barbell-visual {
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
			gap: 0.85rem;
			padding-top: 1rem;
		}

		.barbell-shaft {
			left: 50%;
			width: calc(100% - 1rem);
			transform: translateX(-50%);
			bottom: 8.55rem;
		}

		.barbell-center {
			order: -1;
		}

		.barbell-side {
			width: 100%;
			justify-content: center;
		}

		.barbell-side--left {
			order: 1;
		}

		.barbell-side--right {
			order: 2;
		}
	}
</style>