<script lang="ts">
	import { scale } from 'svelte/transition';

	import type { BarWeight, PlateCount, PlateWeight } from '$lib/types/gym';
	import { formatWeight } from '$lib/utils/formatting';
	import { PLATE_MAP } from '$lib/utils/plates';

	export let barWeight: BarWeight = 20;
	export let plates: PlateCount[] = [];

	// heavy → light, used for both sides (left arm uses row-reverse CSS)
	$: expandedPlates = plates.flatMap((plate) => Array.from({ length: plate.count }, () => plate.weight));

	function plateThickness(weight: PlateWeight): number {
		const plate = PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP];
		return Math.max(6, plate.thickness);
	}

	function plateHeight(weight: PlateWeight): number {
		const plate = PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP];
		if (plate.kind === 'bumper') return weight === 5 ? 100 : 120;
		return Math.max(40, Math.round(plate.radius * 1.5));
	}

	function plateColor(weight: PlateWeight): string {
		return PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP].color;
	}

	function plateEdge(weight: PlateWeight): string {
		return PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP].edgeColor;
	}
</script>

<div class="stack-shell">
	<div class="stack-heading">
		<p>Bar visualization</p>
		<strong>{formatWeight(barWeight)} bar</strong>
	</div>

	<div class="barbell-wrap" aria-label={`Barbell loaded with ${formatWeight(barWeight)} bar`}>
		<!-- Shaft runs behind everything, centered vertically -->
		<div class="shaft" aria-hidden="true"></div>

		<div class="barbell-row">
			<!-- Left arm: DOM order heavy→light + sleeve + cap; row-reverse flips visual to cap→sleeve→light→heavy→center -->
			<div class="arm arm--left" aria-label="Left side">
				{#each expandedPlates as weight, i (`left-${weight}-${i}`)}
					<div
						class="plate"
						style="width:{plateThickness(weight)}px;height:{plateHeight(weight)}px;background:{plateColor(weight)};border-color:{plateEdge(weight)}"
						in:scale={{ duration: 180, start: 0.8 }}
						out:scale={{ duration: 140, start: 0.85 }}
					>
						<span>{weight}</span>
					</div>
				{/each}
				<div class="sleeve" aria-hidden="true"></div>
				<div class="end-cap" aria-hidden="true"></div>
			</div>

			<!-- Center label -->
			<div class="bar-label">
				<span>{barWeight} kg</span>
				<small>bar</small>
			</div>

			<!-- Right arm: sleeve + cap at the end; visual order heavy→light→sleeve→cap from center -->
			<div class="arm arm--right" aria-label="Right side">
				{#each expandedPlates as weight, i (`right-${weight}-${i}`)}
					<div
						class="plate"
						style="width:{plateThickness(weight)}px;height:{plateHeight(weight)}px;background:{plateColor(weight)};border-color:{plateEdge(weight)}"
						in:scale={{ duration: 180, start: 0.8 }}
						out:scale={{ duration: 140, start: 0.85 }}
					>
						<span>{weight}</span>
					</div>
				{/each}
				<div class="sleeve" aria-hidden="true"></div>
				<div class="end-cap" aria-hidden="true"></div>
			</div>
		</div>
	</div>

	{#if expandedPlates.length === 0}
		<p class="empty-note">No plates needed — the empty bar already matches.</p>
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

	/* Outer container: shaft is absolute, row is relative on top */
	.barbell-wrap {
		position: relative;
		overflow-x: auto;
		overflow-y: visible;
		padding: 0.5rem 0;
	}

	/* Shaft spans full width, centered vertically behind plates */
	.shaft {
		position: absolute;
		inset: 0;
		top: 50%;
		height: 0.5rem;
		transform: translateY(-50%);
		background: #b6aea6;
		border-radius: 999px;
		z-index: 0;
	}

	/* Always-horizontal flex row */
	.barbell-row {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		min-height: 8rem;
	}

	/* Each arm is a horizontal row of plates + sleeve + end-cap */
	.arm {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	/*
	 * Left arm: row-reverse flips the visual so DOM [heavy…light, sleeve, cap]
	 * renders as visual [cap, sleeve, light…heavy] → heaviest is closest to center label.
	 */
	.arm--left {
		flex-direction: row-reverse;
	}

	/* Individual plate: tall narrow rectangle (side-profile view) */
	.plate {
		flex-shrink: 0;
		border-radius: 3px;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.06);
	}

	.plate span {
		font-family: 'Archivo', sans-serif;
		font-size: 0.6rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.75);
		writing-mode: vertical-rl;
		transform: rotate(180deg);
	}

	/* Sleeve: the bar extension plates slide onto */
	.sleeve {
		flex-shrink: 0;
		width: 1.2rem;
		height: 0.75rem;
		background: #c7beb6;
		border-radius: 2px;
	}

	/* End cap: outer tip of the sleeve */
	.end-cap {
		flex-shrink: 0;
		width: 0.35rem;
		height: 1.75rem;
		background: #aaa39b;
		border-radius: 2px;
	}

	/* Center bar label */
	.bar-label {
		display: grid;
		justify-items: center;
		padding: 0.4rem 0.65rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.85);
		border: 1px solid var(--outline);
		margin: 0 0.4rem;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.bar-label span {
		font-family: 'Archivo', sans-serif;
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--ink-strong);
	}

	.bar-label small {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink-soft);
	}

	.empty-note {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.9rem;
	}
</style>