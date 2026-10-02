// Every safety-relevant number lives here, each with its source or an explicit TODO.
// Never add a value without a verifiable citation (see CLAUDE.md, "Never fabricate safety data").

const METERS_PER_MILE = 1609.344;
const SECONDS_PER_HOUR = 3600;

export function mphToMetersPerSecond(mph: number): number {
  return (mph * METERS_PER_MILE) / SECONDS_PER_HOUR;
}

/**
 * Walking speeds for evacuation estimates, in meters per second.
 *
 * Source: FEMA P-646, "Guidelines for Design of Structures for Vertical Evacuation from
 * Tsunamis", Third Edition (August 2019), Chapter 5, p. 5-2:
 * "The average, healthy person can walk at approximately 4 mph. [...] The average pace of a
 * mobility-impaired population can be assumed to be about 2 mph."
 * https://www.fema.gov/sites/default/files/documents/fema_rsl_guidelines-for-design-of-structures-for-vertical-evacuation-from-tsunamis_050925.pdf
 *
 * Caution: FEMA uses these to space evacuation structures, not to promise arrival times.
 * 4 mph is an optimistic pace, so estimates must be shown as a range and never as "you have time".
 */
/**
 * Farthest a position (or a meeting point) may be from the walking network before Evacua stops
 * computing a route and shows only a labeled straight line.
 * Engineering choice, not a safety standard: beyond ~250 m the path to the network is unknown.
 */
export const MAX_SNAP_DISTANCE_M = 250;

export const WALKING_SPEED_MPS = {
  averageHealthyAdult: mphToMetersPerSecond(4),
  mobilityImpaired: mphToMetersPerSecond(2),
} as const;
