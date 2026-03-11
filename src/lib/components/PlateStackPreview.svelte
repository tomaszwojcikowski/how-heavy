<script lang="ts">
	import { scale, fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	import type { BarWeight, PlateCount, PlateWeight } from '$lib/types/gym';
	import { formatWeight } from '$lib/utils/formatting';
	import { PLATE_MAP } from '$lib/utils/plates';

	export let barWeight: BarWeight = 20;
	export let plates: PlateCount[] = [];
	export let emptyMessage = 'No plates needed — the empty bar already matches.';
	export let emptyHint = 'Tap a preset or add plates above to preview the load.';
	export let emptyGhostWeights: PlateWeight[] = [20, 10, 2.5];
	export let onRemovePlate: ((weight: PlateWeight) => void) | null = null;
	export let realistic = false;

	import { triggerHaptic } from '$lib/utils/haptics';

	function handleRemove(weight: PlateWeight) {
		if (onRemovePlate) {
			triggerHaptic();
			onRemovePlate(weight);
		}
	}

	// heavy → light, used for both sides (left arm uses row-reverse CSS)
	$: expandedPlates = plates.flatMap((plate) => Array.from({ length: plate.count }, () => plate.weight));
	$: showingGhost = expandedPlates.length === 0;
	$: renderedPlates = showingGhost ? emptyGhostWeights : expandedPlates;

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

	function plateAccent(weight: PlateWeight): string {
		return PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP].accentColor;
	}

	function plateText(weight: PlateWeight): string {
		return PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP].textColor;
	}

	function plateRim(weight: PlateWeight): string {
		return PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP].rimColor ?? plateAccent(weight);
	}

	function plateKind(weight: PlateWeight): 'bumper' | 'change' {
		return PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP].kind;
	}

	$: barPalette =
		barWeight === 20
			? {
				shaft: '#b3261e',
				shaftHighlight: '#e46962',
				sleeve: '#d84a42',
				endCap: '#7f1712'
			}
			: {
				shaft: '#1f1f1f',
				shaftHighlight: '#545454',
				sleeve: '#333333',
				endCap: '#0b0b0b'
			};
</script>

<div class="stack-shell">
	<div class="barbell-wrap" aria-label={`Barbell loaded with ${formatWeight(barWeight)}`}>
		<!-- Shaft runs behind everything, centered vertically -->
		<div
			class="shaft"
			style={`--shaft-color:${barPalette.shaft};--shaft-highlight:${barPalette.shaftHighlight};`}
			aria-hidden="true"
		></div>

		<div class="barbell-row">
			<!-- Left arm: DOM order heavy→light + sleeve + cap; row-reverse flips visual to cap→sleeve→light→heavy→center -->
			<div class="arm arm--left" aria-label="Left side">
				{#each renderedPlates as weight, i (`left-${weight}-${i}`)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<svelte:element
						this={onRemovePlate && !showingGhost ? 'button' : 'div'}
						type={onRemovePlate && !showingGhost ? 'button' : undefined}
						class="plate"
						class:plate--ghost={showingGhost}
						class:plate--interactive={onRemovePlate && !showingGhost}
						class:plate--realistic={realistic}
						class:plate--bumper={plateKind(weight) === 'bumper'}
						style="width:{plateThickness(weight)}px;height:{plateHeight(weight)}px;--plate-fill:{plateColor(weight)};--plate-edge:{plateEdge(weight)};--plate-accent:{plateAccent(weight)};--plate-text:{plateText(weight)};--plate-rim:{plateRim(weight)};border-color:{plateEdge(weight)}"
						onclick={onRemovePlate && !showingGhost ? () => handleRemove(weight) : undefined}
						aria-label={onRemovePlate && !showingGhost ? `Remove ${weight} kg plate` : undefined}
						in:fly={{ y: -30, duration: 450, easing: backOut }}
						out:fly={{ y: -20, duration: 250, easing: backOut }}
					>
						{#if realistic}
							<span class="plate__ridge plate__ridge--top" aria-hidden="true"></span>
							<span class="plate__ridge plate__ridge--mid" aria-hidden="true"></span>
							<span class="plate__ridge plate__ridge--bottom" aria-hidden="true"></span>
							<span class="plate__hub" aria-hidden="true"></span>
							{#if plateKind(weight) === 'bumper'}
								<span class="plate__rim plate__rim--top" aria-hidden="true"></span>
								<span class="plate__rim plate__rim--bottom" aria-hidden="true"></span>
							{/if}
						{/if}
						<span class="plate__stamp">{weight}</span>
					</svelte:element>
				{/each}
				<div class="sleeve" style={`--sleeve-color:${barPalette.sleeve};`} aria-hidden="true"></div>
				<div class="end-cap" style={`--end-cap-color:${barPalette.endCap};`} aria-hidden="true"></div>
			</div>

			<!-- Center label -->
			<div class="bar-label">
				<span>{barWeight} kg</span>
			</div>

			<!-- Right arm: sleeve + cap at the end; visual order heavy→light→sleeve→cap from center -->
			<div class="arm arm--right" aria-label="Right side">
				{#each renderedPlates as weight, i (`right-${weight}-${i}`)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<svelte:element
						this={onRemovePlate && !showingGhost ? 'button' : 'div'}
						type={onRemovePlate && !showingGhost ? 'button' : undefined}
						class="plate"
						class:plate--ghost={showingGhost}
						class:plate--interactive={onRemovePlate && !showingGhost}
						class:plate--realistic={realistic}
						class:plate--bumper={plateKind(weight) === 'bumper'}
						style="width:{plateThickness(weight)}px;height:{plateHeight(weight)}px;--plate-fill:{plateColor(weight)};--plate-edge:{plateEdge(weight)};--plate-accent:{plateAccent(weight)};--plate-text:{plateText(weight)};--plate-rim:{plateRim(weight)};border-color:{plateEdge(weight)}"
						onclick={onRemovePlate && !showingGhost ? () => handleRemove(weight) : undefined}
						aria-label={onRemovePlate && !showingGhost ? `Remove ${weight} kg plate` : undefined}
						in:fly={{ y: -30, duration: 450, easing: backOut }}
						out:fly={{ y: -20, duration: 250, easing: backOut }}
					>
						{#if realistic}
							<span class="plate__ridge plate__ridge--top" aria-hidden="true"></span>
							<span class="plate__ridge plate__ridge--mid" aria-hidden="true"></span>
							<span class="plate__ridge plate__ridge--bottom" aria-hidden="true"></span>
							<span class="plate__hub" aria-hidden="true"></span>
							{#if plateKind(weight) === 'bumper'}
								<span class="plate__rim plate__rim--top" aria-hidden="true"></span>
								<span class="plate__rim plate__rim--bottom" aria-hidden="true"></span>
							{/if}
						{/if}
						<span class="plate__stamp">{weight}</span>
					</svelte:element>
				{/each}
				<div class="sleeve" style={`--sleeve-color:${barPalette.sleeve};`} aria-hidden="true"></div>
				<div class="end-cap" style={`--end-cap-color:${barPalette.endCap};`} aria-hidden="true"></div>
			</div>
		</div>
	</div>

	{#if showingGhost}
		<div class="empty-state">
			<p class="empty-note">{emptyMessage}</p>
			<p class="empty-hint">{emptyHint}</p>
		</div>
	{/if}
</div>

<style>
	.stack-shell {
		display: grid;
		gap: 1rem;
	}

	/* Outer container: shaft is absolute, row is relative on top */
	.barbell-wrap {
		position: relative;
		overflow-x: auto;
		overflow-y: visible;
		padding: 0.5rem 0;
		scrollbar-width: none;
	}

	.barbell-wrap::-webkit-scrollbar {
		display: none;
	}

	/* Shaft spans full width, centered vertically behind plates */
	.shaft {
		position: absolute;
		inset: 0;
		top: 50%;
		height: 0.5rem;
		transform: translateY(-50%);
		background:
			repeating-linear-gradient(
				90deg,
				transparent,
				transparent 5px,
				rgba(255, 255, 255, 0.14) 5px,
				rgba(255, 255, 255, 0.14) 6px
			),
			var(--shaft-color);
		border-radius: 999px;
		z-index: 0;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 1px 2px rgba(0, 0, 0, 0.14);
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
		position: relative;
		border-radius: 3px;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, white 10%, var(--plate-fill)) 0%,
				var(--plate-fill) 20%,
				color-mix(in srgb, var(--plate-fill) 70%, var(--plate-edge)) 52%,
				var(--plate-fill) 82%,
				color-mix(in srgb, black 18%, var(--plate-fill)) 100%
			);
		box-shadow:
			inset 1px 0 0 rgba(255, 255, 255, 0.06),
			inset -1px 0 0 rgba(0, 0, 0, 0.24);
		padding: 0;
		cursor: default;
		overflow: hidden;
	}

	.plate--realistic {
		border-radius: 8px;
		box-shadow:
			inset 1px 0 0 rgba(255, 255, 255, 0.12),
			inset -1px 0 0 rgba(0, 0, 0, 0.28),
			0 1px 2px rgba(0, 0, 0, 0.16);
	}

	.plate.plate--interactive {
		cursor: pointer;
		transition: opacity 0.12s ease, transform 0.12s ease;
	}

	.plate.plate--interactive:hover {
		opacity: 0.72;
		transform: scaleY(0.94);
	}

	.plate.plate--interactive:active {
		opacity: 0.55;
		transform: scaleY(0.9);
	}

	.plate.plate--ghost {
		opacity: 0.28;
		filter: saturate(0.72);
	}

	.plate__stamp {
		position: relative;
		z-index: 2;
		font-family: 'Archivo', sans-serif;
		font-size: 0.6rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--plate-text) 88%, white 12%);
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		text-shadow:
			0 1px 1px rgba(0, 0, 0, 0.55),
			0 0 8px rgba(0, 0, 0, 0.3);
	}

	.plate--realistic .plate__stamp {
		padding: 0.18rem 0.04rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--plate-edge) 78%, black 22%);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.08),
			0 1px 2px rgba(0, 0, 0, 0.28);
	}

	.plate__ridge,
	.plate__hub,
	.plate__rim {
		position: absolute;
		left: 0;
		right: 0;
		pointer-events: none;
	}

	.plate__ridge {
		height: 1px;
		background: color-mix(in srgb, var(--plate-accent) 38%, transparent);
		opacity: 0.42;
	}

	.plate__ridge--top {
		top: 14%;
	}

	.plate__ridge--mid {
		top: 50%;
		transform: translateY(-50%);
		opacity: 0.26;
	}

	.plate__ridge--bottom {
		bottom: 14%;
	}

	.plate__hub {
		top: 50%;
		left: 18%;
		right: 18%;
		height: clamp(0.2rem, 9%, 0.45rem);
		transform: translateY(-50%);
		border-radius: 999px;
		background: linear-gradient(180deg, #ece6df, #b8afa4 55%, #f7f2ed);
		box-shadow:
			0 0 0 1px rgba(49, 38, 30, 0.28),
			inset 0 1px 0 rgba(255, 255, 255, 0.42);
		opacity: 0.78;
	}

	.plate__rim {
		height: 3px;
		left: 8%;
		right: 8%;
		border-radius: 999px;
		background: var(--plate-rim);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
		opacity: 0.88;
	}

	.plate__rim--top {
		top: 6%;
	}

	.plate__rim--bottom {
		bottom: 6%;
	}

	/* Sleeve: the bar extension plates slide onto */
	.sleeve {
		flex-shrink: 0;
		width: 1.2rem;
		height: 0.75rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 34%),
			linear-gradient(90deg, color-mix(in srgb, var(--sleeve-color) 70%, white 30%), var(--sleeve-color) 62%, color-mix(in srgb, var(--sleeve-color) 78%, black 22%));
		border-radius: 2px;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), inset 0 -1px 0 rgba(0, 0, 0, 0.18);
	}

	/* End cap: outer tip of the sleeve */
	.end-cap {
		flex-shrink: 0;
		width: 0.35rem;
		height: 1.75rem;
		background: linear-gradient(180deg, color-mix(in srgb, var(--end-cap-color) 78%, white 22%), var(--end-cap-color) 58%, color-mix(in srgb, var(--end-cap-color) 70%, black 30%));
		border-radius: 2px;
	}

	/* Center bar label */
	.bar-label {
		display: grid;
		justify-items: center;
		padding: 0.4rem 0.65rem;
		border-radius: 6px;
		background: var(--md-sys-color-surface-container-lowest);
		border: 1px solid var(--outline);
		margin: 0 0.4rem;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.bar-label span {
		font-family: 'Archivo', sans-serif;
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.empty-state {
		display: grid;
		gap: 0.3rem;
	}

	.empty-note {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.empty-hint {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.35;
		color: var(--text-tertiary);
	}
</style>