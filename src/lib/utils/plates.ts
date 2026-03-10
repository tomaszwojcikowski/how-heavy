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
		color: '#e83f3f',
		accentColor: '#ffb2a8',
		textColor: '#fff7f4',
		radius: 96,
		ringRadius: 27,
		order: 1
	},
	{
		weight: 15,
		units: 60,
		kind: 'bumper',
		label: '15 kg bumper',
		shortLabel: '15',
		color: '#f0c63c',
		accentColor: '#fff1ab',
		textColor: '#402b00',
		radius: 90,
		ringRadius: 25,
		order: 2
	},
	{
		weight: 10,
		units: 40,
		kind: 'bumper',
		label: '10 kg bumper',
		shortLabel: '10',
		color: '#2fbe71',
		accentColor: '#b4ffd0',
		textColor: '#f4fff7',
		radius: 84,
		ringRadius: 24,
		order: 3
	},
	{
		weight: 5,
		units: 20,
		kind: 'bumper',
		label: '5 kg bumper',
		shortLabel: '5',
		color: '#3f73ff',
		accentColor: '#bfd0ff',
		textColor: '#f7f9ff',
		radius: 76,
		ringRadius: 21,
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
		radius: 58,
		ringRadius: 15,
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
		radius: 54,
		ringRadius: 14,
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
		radius: 50,
		ringRadius: 13,
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
		radius: 46,
		ringRadius: 12,
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
		radius: 42,
		ringRadius: 11,
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
		radius: 38,
		ringRadius: 10,
		order: 10
	}
] satisfies readonly PlateDefinition[];

export const PLATE_DEFINITIONS_ASC = [...PLATE_DEFINITIONS].reverse();

export const PLATE_MAP = Object.fromEntries(
	PLATE_DEFINITIONS.map((plate) => [plate.weight.toString(), plate])
) as Record<PlateWeightKey, PlateDefinition>;

export function toQuarterKiloUnits(weight: number): number {
	return Math.round(weight * QUARTER_KILO_UNITS);
}

export function fromQuarterKiloUnits(units: number): number {
	return units / QUARTER_KILO_UNITS;
}

export function plateKey(weight: PlateWeight): PlateWeightKey {
	return weight.toString() as PlateWeightKey;
}

export function isSupportedBarWeight(weight: number): weight is BarWeight {
	return BAR_OPTIONS.includes(weight as BarWeight);
}

export function isSupportedPlateWeight(weight: number): weight is PlateWeight {
	return SUPPORTED_PLATE_WEIGHTS.includes(weight as PlateWeight);
}