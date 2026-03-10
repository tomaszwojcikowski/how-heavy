export function formatWeight(value: number | null | undefined): string {
	if (value === null || value === undefined || Number.isNaN(value)) {
		return '--';
	}

	return Number.isInteger(value) ? `${value} kg` : `${value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')} kg`;
}