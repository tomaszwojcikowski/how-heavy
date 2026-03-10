import { getPlateCombinationForSideWeight, resolveTargetLoad } from '$lib/utils/calculations';
import { PLATE_MAP, fromQuarterKiloUnits, toQuarterKiloUnits } from '$lib/utils/plates';
import type { BarWeight, PlateCount, PlateWeight, TargetLoadResult } from '$lib/types/gym';

export interface SetStep {
	id: number;
	percentage: string;
}

export interface ComputedSetStep {
	id: number;
	percentage: number;
	targetTotal: number;
	result: TargetLoadResult;
	/** Plates to add vs the previous step (heaviest first) */
	additions: PlateCount[];
	/** Plates to remove vs the previous step (heaviest first) */
	removals: PlateCount[];
	/** Total number of individual plate moves (adds + removes) */
	changeCost: number;
}

function mergePlates(a: PlateCount[], b: PlateCount[]): PlateCount[] {
	const map = new Map<PlateWeight, number>();
	for (const { weight, count } of [...a, ...b]) {
		map.set(weight, (map.get(weight) ?? 0) + count);
	}
	return Array.from(map.entries())
		.map(([weight, count]) => ({ weight, count }))
		.sort((a, b) => b.weight - a.weight);
}

/**
 * Find the minimum plate combination for `delta` kg per side.
 * If the exact delta isn't achievable (e.g. 0.75 kg with 0.5 kg minimum plate),
 * round up in 0.25 kg increments until achievable (max +1 kg overshoot).
 */
function addPlatesForDelta(delta: number): PlateCount[] | null {
	for (let bump = 0; bump <= 4; bump++) {
		const adjusted = fromQuarterKiloUnits(toQuarterKiloUnits(delta) + bump);
		const combo = getPlateCombinationForSideWeight(adjusted);
		if (combo !== null) return combo;
	}
	return null;
}

/** True for bumper plates (5 kg+) — these are kept on the bar between sets. */
function isBumperPlate(weight: PlateWeight): boolean {
	return PLATE_MAP[weight.toString() as keyof typeof PLATE_MAP]?.kind === 'bumper';
}

/**
 * Build a result keeping all bumper plates from `lockedBumpers` in place and
 * computing a fresh small-plate combination for the remaining side weight.
 * Returns null when the remaining weight isn't achievable.
 */
function buildResultLockingBumpers(
	barWeight: BarWeight,
	targetTotal: number,
	targetSideWeight: number,
	lockedBumpers: PlateCount[]
): TargetLoadResult | null {
	const bumperWeight = lockedBumpers.reduce((s, p) => s + p.weight * p.count, 0);
	const remaining = Number.parseFloat((targetSideWeight - bumperWeight).toFixed(4));
	if (remaining < 0) return null;
	const remainderCombo = remaining > 0.001 ? getPlateCombinationForSideWeight(remaining) : [];
	if (remainderCombo === null) return null;
	return makeResult(barWeight, targetTotal, mergePlates(lockedBumpers, remainderCombo));
}

/**
 * Find the best subset of `constraintPlates` whose total ≤ targetSideWeight,
 * choosing the combination closest to target (bounded knapsack).
 * Used when a step is lighter than the previous (e.g. descending percentages).
 */
function findSubsetCombo(targetSideWeight: number, constraintPlates: PlateCount[]): PlateCount[] {
	const targetUnits = toQuarterKiloUnits(targetSideWeight);
	const available = constraintPlates
		.filter((p) => p.count > 0)
		.map((p) => ({ weight: p.weight as PlateWeight, count: p.count, units: toQuarterKiloUnits(p.weight) }))
		.sort((a, b) => b.units - a.units);

	if (targetUnits === 0 || available.length === 0) return [];

	const dp: Array<Array<{ weight: PlateWeight; count: number }> | null> = Array.from(
		{ length: targetUnits + 1 },
		() => null
	);
	dp[0] = [];

	for (const { weight, count, units } of available) {
		for (let u = targetUnits; u >= units; u--) {
			for (let k = 1; k <= count && k * units <= u; k++) {
				const prev = dp[u - k * units];
				if (prev === null) continue;
				if (dp[u] === null) dp[u] = [...prev, { weight, count: k }];
			}
		}
	}

	for (let u = targetUnits; u >= 0; u--) {
		if (dp[u] !== null) {
			const merged = new Map<PlateWeight, number>();
			for (const { weight, count } of dp[u]!) {
				merged.set(weight, (merged.get(weight) ?? 0) + count);
			}
			return Array.from(merged.entries())
				.map(([w, c]) => ({ weight: w, count: c }))
				.sort((a, b) => b.weight - a.weight);
		}
	}
	return [];
}

function diffPlates(prev: PlateCount[], next: PlateCount[]): { additions: PlateCount[]; removals: PlateCount[] } {
	const additions: PlateCount[] = [];
	const removals: PlateCount[] = [];
	const prevMap = new Map(prev.map((p) => [p.weight, p.count]));
	const nextMap = new Map(next.map((p) => [p.weight, p.count]));
	const weights = new Set([...prevMap.keys(), ...nextMap.keys()]);
	for (const weight of weights) {
		const prevCount = prevMap.get(weight) ?? 0;
		const nextCount = nextMap.get(weight) ?? 0;
		if (nextCount > prevCount) additions.push({ weight, count: nextCount - prevCount });
		if (nextCount < prevCount) removals.push({ weight, count: prevCount - nextCount });
	}
	additions.sort((a, b) => b.weight - a.weight);
	removals.sort((a, b) => b.weight - a.weight);
	return { additions, removals };
}

/**
 * Consolidate pairs of smaller change plates into a single larger equivalent:
 * 2×1.25 kg → 1×2.5 kg, then 2×2.5 kg → 1×5 kg bumper.
 * Iterates until stable so 4×1.25 → 2×2.5 → 1×5 is resolved in one call.
 * Total side weight is conserved exactly.
 */
function consolidatePlates(plates: PlateCount[]): PlateCount[] {
	const map = new Map<number, number>(plates.map((p) => [p.weight, p.count]));
	const rules: [number, number][] = [[1.25, 2.5], [2.5, 5]];
	let changed = true;
	while (changed) {
		changed = false;
		for (const [from, to] of rules) {
			const n = map.get(from) ?? 0;
			const pairs = Math.floor(n / 2);
			if (pairs === 0) continue;
			map.set(from, n - pairs * 2);
			if ((map.get(from) ?? 0) === 0) map.delete(from);
			map.set(to, (map.get(to) ?? 0) + pairs);
			changed = true;
		}
	}
	return Array.from(map.entries())
		.map(([weight, count]) => ({ weight: weight as PlateWeight, count }))
		.sort((a, b) => b.weight - a.weight);
}

/** Total plate-move cost (additions + removals) between two bar states. */
function moveCost(prev: PlateCount[], next: PlateCount[]): number {
	const { additions, removals } = diffPlates(prev, next);
	return additions.reduce((s, p) => s + p.count, 0) + removals.reduce((s, p) => s + p.count, 0);
}

/** Build a TargetLoadResult from a concrete plate list (total weight already known to be achievable). */
function makeResult(barWeight: BarWeight, requestedTotal: number, plates: PlateCount[]): TargetLoadResult {
	const achievedSide = Number.parseFloat(plates.reduce((s, p) => s + p.weight * p.count, 0).toFixed(4));
	const achievedTotal = fromQuarterKiloUnits(toQuarterKiloUnits(barWeight + achievedSide * 2));
	const isExact = Math.abs(achievedTotal - requestedTotal) < 0.01;
	return {
		status: isExact ? 'exact' : 'rounded',
		barWeight,
		requestedTotal,
		resolvedTotal: achievedTotal,
		exact: isExact,
		oneSideWeight: achievedSide,
		delta: Number.parseFloat((achievedTotal - requestedTotal).toFixed(2)),
		plates,
		message: isExact ? 'Exact plate loading available.' : `Nearest achievable: ${achievedTotal} kg.`
	};
}

/**
 * Smart set-sequence algorithm — ascending build strategy.
 *
 * Processes steps lightest → heaviest. Each heavier step is built by ADDING
 * the minimum plates to the previous step's bar. This guarantees you never
 * remove a heavy plate to load the next set — you just stack more on top.
 *
 * If a delta can't be hit exactly (e.g. 0.75 kg against a 0.5 kg minimum plate),
 * the delta is rounded up by up to 1 kg/side to find the nearest achievable weight.
 *
 * If steps go downward in weight (unusual but valid), the algorithm removes the
 * smallest plates first, preserving heavy plates already on the bar.
 */
export function computeSmartSetSequence(
	steps: SetStep[],
	barWeight: BarWeight,
	oneRm: number
): ComputedSetStep[] {
	if (!Number.isFinite(oneRm) || oneRm <= 0 || steps.length === 0) return [];

	const parsed = steps
		.map((s) => ({ id: s.id, percentage: Number.parseFloat(s.percentage) }))
		.filter((s) => Number.isFinite(s.percentage) && s.percentage > 0 && s.percentage <= 200)
		.sort((a, b) => a.percentage - b.percentage);

	if (parsed.length === 0) return [];

	const results: TargetLoadResult[] = [];

	for (let i = 0; i < parsed.length; i++) {
		const targetTotal = Math.round(((oneRm * parsed[i].percentage) / 100) * 4) / 4;
		const targetSideWeight = (targetTotal - barWeight) / 2;
		const prev = results[i - 1] ?? null;

		// First step, or previous step was invalid / below-bar — compute unconstrained
		if (prev === null || prev.status === 'invalid' || prev.status === 'below-bar' || targetSideWeight <= 0) {
			results.push(resolveTargetLoad(barWeight, targetTotal));
			continue;
		}

		const prevSideWeight = prev.oneSideWeight ?? 0;
		const delta = Number.parseFloat((targetSideWeight - prevSideWeight).toFixed(4));

		// ── Same weight as previous step ──────────────────────────────────────────
		if (Math.abs(delta) < 0.01) {
			results.push({ ...prev, requestedTotal: targetTotal });
			continue;
		}

		// ── Weight going UP ───────────────────────────────────────────────────────
		if (delta > 0.01) {
			// Candidate A: add the minimum delta plates on top of the previous bar,
			// then consolidate any resulting pairs of small plates into larger
			// equivalents (2×2.5→5 kg bumper, 2×1.25→2.5 kg).
			// Usually the fewest plate moves.
			const deltaPlates = addPlatesForDelta(delta);
			const candidateA = deltaPlates !== null
				? consolidatePlates(mergePlates(prev.plates, deltaPlates))
				: null;

			// Candidate B: lock all bumper plates from the previous step in place
			// and fresh-compute an optimal change-plate fill for the remaining
			// side weight. Preferred when prev has many accumulated change plates.
			const prevBumpers = prev.plates.filter((p) => isBumperPlate(p.weight));
			const freshResult = buildResultLockingBumpers(barWeight, targetTotal, targetSideWeight, prevBumpers);
			const candidateB = freshResult !== null ? freshResult.plates : null;

			// Pick whichever requires fewer plate moves; tiebreak by fewest total plates.
			const candidates = ([candidateA, candidateB].filter(Boolean) as PlateCount[][])
				.map((plates) => ({
					plates,
					cost: moveCost(prev.plates, plates),
					count: plates.reduce((s, p) => s + p.count, 0)
				}))
				.sort((a, b) => a.cost - b.cost || a.count - b.count);

			if (candidates.length > 0) {
				results.push(makeResult(barWeight, targetTotal, candidates[0].plates));
				continue;
			}
		}

		// ── Weight going DOWN: keep bumpers, rerack change plates first ───────────
		if (delta < -0.01) {
			const prevBumpers = prev.plates.filter((p) => isBumperPlate(p.weight));
			const bumperWeight = prevBumpers.reduce((s, p) => s + p.weight * p.count, 0);

			if (targetSideWeight >= bumperWeight) {
				// Target is still above total bumper weight — keep all bumpers and
				// only adjust the small change plates.
				const remaining = Number.parseFloat((targetSideWeight - bumperWeight).toFixed(4));
				const prevChange = prev.plates.filter((p) => !isBumperPlate(p.weight));
				const changeSubset = remaining > 0.001 ? findSubsetCombo(remaining, prevChange) : [];
				results.push(makeResult(barWeight, targetTotal, consolidatePlates(mergePlates(prevBumpers, changeSubset))));
				continue;
			}

			// Target is below total bumper weight — must remove some bumpers too.
			results.push(makeResult(barWeight, targetTotal, consolidatePlates(findSubsetCombo(targetSideWeight, prev.plates))));
			continue;
		}

		// Fallback (should rarely be reached)
		results.push(resolveTargetLoad(barWeight, targetTotal));
	}

	// Compute diffs
	return parsed.map((s, i) => {
		const { additions, removals } =
			i === 0
				? { additions: results[i].plates ?? [], removals: [] }
				: diffPlates(results[i - 1].plates, results[i].plates);
		const changeCost =
			additions.reduce((sum, p) => sum + p.count, 0) +
			removals.reduce((sum, p) => sum + p.count, 0);
		return {
			id: s.id,
			percentage: s.percentage,
			targetTotal: Math.round(((oneRm * s.percentage) / 100) * 4) / 4,
			result: results[i],
			additions,
			removals,
			changeCost
		};
	});
}



