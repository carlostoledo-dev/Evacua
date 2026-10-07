/**
 * Evacua covers one hazard: tsunami (owner decision 2026-10-07). Data layers still declare the
 * hazard they were published for, so a file made for another hazard fails validation instead
 * of being drawn as tsunami data.
 */
export const HAZARD_IDS = ['tsunami'] as const;
export type HazardId = (typeof HAZARD_IDS)[number];
