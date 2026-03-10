export const SUPPORTED_BAR_WEIGHTS = [15, 20] as const;

export const SUPPORTED_PLATE_WEIGHTS = [20, 15, 10, 5, 2.5, 2, 1.5, 1.25, 1, 0.5] as const;

export type BarWeight = (typeof SUPPORTED_BAR_WEIGHTS)[number];
export type PlateWeight = (typeof SUPPORTED_PLATE_WEIGHTS)[number];
export type PlateKind = 'bumper' | 'change';
export type PlateWeightKey = `${PlateWeight}`;

export interface PlateDefinition {
	weight: PlateWeight;
	units: number;
	kind: PlateKind;
	label: string;
	shortLabel: string;
	color: string;
	accentColor: string;
	textColor: string;
	radius: number;
	ringRadius: number;
	order: number;
}

export interface PlateCount {
	weight: PlateWeight;
	count: number;
}

export interface CurrentLoadSummary {
	barWeight: BarWeight;
	plates: readonly PlateWeight[];
	oneSideWeight: number;
	totalWeight: number;
}

export interface TargetLoadResult {
	status: 'exact' | 'rounded' | 'below-bar' | 'invalid';
	barWeight: BarWeight;
	requestedTotal: number;
	resolvedTotal: number | null;
	exact: boolean;
	oneSideWeight: number | null;
	delta: number | null;
	plates: PlateCount[];
	message: string;
}