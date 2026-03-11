export const appName = 'How Heavy';

export const tagline = 'Plan lifts fast for 15 kg and 20 kg bars.';

export const modeLabels = {
	findPlates: 'Find Plates',
	countPlates: 'Count Plates',
	trainingSets: 'Sets'
} as const;

export const navLabels = {
	findPlates: 'Load',
	countPlates: 'Count',
	trainingSets: 'Plan'
} as const;

export const modeDescriptions = {
	findPlates: 'Set a total weight and see what to load on each side.',
	countPlates: 'Tap what is on the bar and get the total weight.',
	trainingSets: 'Build percentage sets from your 1RM and keep plate changes efficient.'
} as const;

export const featureHighlights = [
	'Find the plates for any target weight.',
	'Count a loaded bar from one side only.',
	'Preview every load with clear plate graphics.'
] as const;