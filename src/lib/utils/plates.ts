import { SUPPORTED_BAR_WEIGHTS, SUPPORTED_PLATE_WEIGHTS, type BarWeight, type PlateDefinition, type PlateWeight, type PlateWeightKey } from '$lib/types/gym';

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
		color: '#4b4e57',
		accentColor: '#d4dae6',
		textColor: '#f5f7fb',
		edgeColor: '#2b2d33',
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
		color: '#8d54ff',
		accentColor: '#ead6ff',
		textColor: '#f9f4ff',
		edgeColor: '#5e37aa',
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
		color: '#ff8d1a',
		accentColor: '#ffe2b5',
		textColor: '#3d1f00',
		edgeColor: '#b9600c',
		radius: 50,
		ringRadius: 13,
		thickness: 6,
		order: 7
	},
	{
		weight: 1.25,
		units: 5,
		kind: 'change',
		label: '1.25 kg change plate',
		shortLabel: '1.25',
		color: '#13a3b3',
		accentColor: '#c0f8ff',
		textColor: '#effcff',
		edgeColor: '#0a6e78',
		radius: 46,
		ringRadius: 12,
		thickness: 6,
		order: 8
	},
	{
		weight: 1,
		units: 4,
		kind: 'change',
		label: '1 kg change plate',
		shortLabel: '1',
		color: '#ff5f7e',
		accentColor: '#ffd1de',
		textColor: '#fff5f8',
		edgeColor: '#b53d56',
		radius: 42,
		ringRadius: 11,
		thickness: 5,
		order: 9
	},
	{
		weight: 0.5,
		units: 2,
		kind: 'change',
		label: '0.5 kg change plate',
		shortLabel: '0.5',
		color: '#0b8a84',
		accentColor: '#b8f5ef',
		textColor: '#effffb',
		edgeColor: '#07655f',
		radius: 38,
		ringRadius: 10,
		thickness: 4,
		order: 10
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