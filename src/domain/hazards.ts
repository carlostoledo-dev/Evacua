export const HAZARD_IDS = ['tsunami', 'wildfire', 'earthquake'] as const;
export type HazardId = (typeof HAZARD_IDS)[number];
