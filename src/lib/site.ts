export const appName = 'How Heavy';

export const tagline = 'Fast weight planning for 15 kg and 20 kg bars.';

export const modeLabels = {
	findPlates: 'Find Plates',
	countPlates: 'Count Plates',
	trainingSets: 'Training Sets'
} as const;

export const modeDescriptions = {
	findPlates: 'Enter a target weight and get the exact plate stack needed on each side.',
	countPlates: 'Tap the plates already loaded and calculate the total bar weight instantly.',
	trainingSets: 'Enter your 1RM and up to 10 percentage-based sets — see exactly how to load each step with minimal plate changes.'
} as const;

export const featureHighlights = [
	'Find the exact plates to load for a target total weight.',
	'Recreate what is already on one side of the bar and see the total instantly.',
	'Use colorful visual plate graphics instead of bare counters.'
] as const;