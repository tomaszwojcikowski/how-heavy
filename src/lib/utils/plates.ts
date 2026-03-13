import { SUPPORTED_BAR_WEIGHTS, SUPPORTED_PLATE_WEIGHTS, type BarWeight, type PlateCount, type PlateDefinition, type PlateWeight, type PlateWeightKey } from '$lib/types/gym';

const QUARTER_KILO_UNITS = 4;

export const BAR_OPTIONS = [...SUPPORTED_BAR_WEIGHTS] satisfies readonly BarWeight[];

export const PLATE_DEFINITIONS = [
	{
		weight: 20,
		units: 80,
		kind: 'bumper',
		label: '20 kg bumper',
		shortLabel: '20',
		color: '#171717',
		accentColor: '#454545',
		textColor: '#f2f2f2',
		edgeColor: '#090909',
		rimColor: '#c0392b',
		radius: 96,
		ringRadius: 27,
		thickness: 34,
		order: 1
	},
	{
		weight: 15,
		units: 60,
		kind: 'bumper',
		label: '15 kg bumper',
		shortLabel: '15',
		color: '#181818',
		accentColor: '#4b4b4b',
		textColor: '#f2f2f2',
		edgeColor: '#0b0b0b',
		rimColor: '#b8960a',
		radius: 96,
		ringRadius: 25,
		thickness: 28,
		order: 2
	},
	{
		weight: 10,
		units: 40,
		kind: 'bumper',
		label: '10 kg bumper',
		shortLabel: '10',
		color: '#1b1b1b',
		accentColor: '#555555',
		textColor: '#f2f2f2',
		edgeColor: '#101010',
		rimColor: '#1e7a3a',
		radius: 96,
		ringRadius: 24,
		thickness: 22,
		order: 3
	},
	{
		weight: 5,
		units: 20,
		kind: 'bumper',
		label: '5 kg bumper',
		shortLabel: '5',
		color: '#202020',
		accentColor: '#5f5f5f',
		textColor: '#f2f2f2',
		edgeColor: '#141414',
		rimColor: '#8a8a8a',
		radius: 90,
		ringRadius: 21,
		thickness: 14,
		order: 4
	},
	{
		weight: 2.5,
		units: 10,
		kind: 'change',
		label: '2.5 kg change plate',
		shortLabel: '2.5',
		color: '#d13a36',
		accentColor: '#ffc8c6',
		textColor: '#fff5f5',
		edgeColor: '#8d2320',
		radius: 58,
		ringRadius: 15,
		thickness: 8,
		order: 5
	},
	{
		weight: 2,
		units: 8,
		kind: 'change',
		label: '2 kg change plate',
		shortLabel: '2',
		color: '#2f7fd9',
		accentColor: '#c7e6ff',
		textColor: '#effcff',
		edgeColor: '#1f5391',
		radius: 54,
		ringRadius: 14,
		thickness: 7,
		order: 6
	},
	{
		weight: 1.5,
		units: 6,
		kind: 'change',
		label: '1.5 kg change plate',
		shortLabel: '1.5',
		color: '#e7bf27',
		accentColor: '#fff1b0',
		textColor: '#3d1f00',
		edgeColor: '#9b7b12',
		radius: 50,
		ringRadius: 13,
		thickness: 6,
		order: 7
	},
	{
		weight: 1,
		units: 4,
		kind: 'change',
		label: '1 kg change plate',
		shortLabel: '1',
		color: '#4db847',
		accentColor: '#c9f5c3',
		textColor: '#f3fff2',
		edgeColor: '#2d762a',
		radius: 42,
		ringRadius: 11,
		thickness: 5,
		order: 8
	},
	{
		weight: 0.5,
		units: 2,
		kind: 'change',
		label: '0.5 kg change plate',
		shortLabel: '0.5',
		color: '#f0efe9',
		accentColor: '#c4c0b6',
		textColor: '#242424',
		edgeColor: '#a59f94',
		radius: 38,
		ringRadius: 10,
		thickness: 4,
		order: 9
	}
] satisfies readonly PlateDefinition[];

export const PLATE_DEFINITIONS_ASC = [...PLATE_DEFINITIONS].reverse();

export const PLATE_MAP = Object.fromEntries(
	PLATE_DEFINITIONS.map((plate) => [plate.weight.toString(), plate])
) as Record<PlateWeightKey, PlateDefinition>;

const MAX_CHANGE_PLATES_PER_SIDE = 4;

export function toQuarterKiloUnits(weight: number): number {
	return Math.round(weight * QUARTER_KILO_UNITS);
}

export function fromQuarterKiloUnits(units: number): number {
	return units / QUARTER_KILO_UNITS;
}

export function plateKey(weight: PlateWeight): PlateWeightKey {
	return weight.toString() as PlateWeightKey;
}

export function getMaxPlateCountPerSide(weight: PlateWeight): number {
	return PLATE_MAP[plateKey(weight)].kind === 'change' ? MAX_CHANGE_PLATES_PER_SIDE : Number.POSITIVE_INFINITY;
}

export function isSupportedBarWeight(weight: number): weight is BarWeight {
	return BAR_OPTIONS.includes(weight as BarWeight);
}

export function isSupportedPlateWeight(weight: number): weight is PlateWeight {
	return SUPPORTED_PLATE_WEIGHTS.includes(weight as PlateWeight);
}

export interface PlateLookupOptions {
	/** Maximum number of a single change-plate weight allowed per side. Bumpers are unlimited. */
	maxChangePerSide: number;
	/**
	 * Index order (into PLATE_DEFINITIONS) used as a final tiebreaker.
	 * Plates listed first are preferred. Defaults to definitions order (heaviest first).
	 */
	tiebreakOrder?: readonly number[];
	/** When true, combinations with more than 2 of a change plate per side are penalised. */
	penalizeCrowdedStacks?: boolean;
}

/**
 * Build a lazy-growing bounded coin-change DP table for plate combinations.
 * Returns a lookup function: given a side weight in quarter-kilo units,
 * returns the optimal PlateCount array or null if the weight isn't achievable.
 */
export function createPlateLookupTable(
	options: PlateLookupOptions
): (sideUnits: number) => PlateCount[] | null {
	const {
		maxChangePerSide,
		tiebreakOrder = PLATE_DEFINITIONS.map((_, i) => i),
		penalizeCrowdedStacks = false
	} = options;

	const entries = PLATE_DEFINITIONS.map((p, index) => ({
		weight: p.weight as PlateWeight,
		units: p.units,
		maxPerSide: p.kind === 'change' ? maxChangePerSide : Number.POSITIVE_INFINITY,
		isChange: p.kind === 'change',
		index
	}));

	const changeIndices = entries.filter((e) => e.isChange).map((e) => e.index);

	type Vec = number[];
	const table: Array<Vec | null> = [Array(entries.length).fill(0) as Vec];

	function compare(a: Vec, b: Vec): number {
		const aTotal = a.reduce((s, n) => s + n, 0);
		const bTotal = b.reduce((s, n) => s + n, 0);
		if (aTotal !== bTotal) return aTotal - bTotal;

		const aChange = changeIndices.reduce((s, i) => s + a[i], 0);
		const bChange = changeIndices.reduce((s, i) => s + b[i], 0);
		if (aChange !== bChange) return aChange - bChange;

		if (penalizeCrowdedStacks) {
			const aCrowded = changeIndices.reduce((s, i) => s + Math.max(0, a[i] - 2), 0);
			const bCrowded = changeIndices.reduce((s, i) => s + Math.max(0, b[i] - 2), 0);
			if (aCrowded !== bCrowded) return aCrowded - bCrowded;
		}

		for (const i of changeIndices) {
			if (a[i] !== b[i]) return b[i] - a[i];
		}

		for (const i of tiebreakOrder) {
			if (a[i] !== b[i]) return b[i] - a[i];
		}

		return 0;
	}

	function grow(maxUnits: number): void {
		for (let units = table.length; units <= maxUnits; units++) {
			let best: Vec | null = null;

			for (const entry of entries) {
				const remainder = units - entry.units;
				if (remainder < 0 || table[remainder] === null) continue;

				const candidate = [...table[remainder]!];
				if (candidate[entry.index] + 1 > entry.maxPerSide) continue;
				candidate[entry.index] += 1;

				if (!best || compare(candidate, best) < 0) best = candidate;
			}

			table[units] = best;
		}
	}

	return function lookup(sideUnits: number): PlateCount[] | null {
		if (sideUnits === 0) return [];
		if (sideUnits < 0) return null;
		grow(sideUnits);
		const vec = table[sideUnits];
		if (!vec) return null;
		return vec
			.map((count, i) => ({ weight: entries[i].weight, count }))
			.filter((p) => p.count > 0);
	};
}