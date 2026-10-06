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

/**
 * A location reading less precise than this (its reported accuracy radius, in meters) gets a
 * visible warning and a shortcut to pick the place on the map.
 * Engineering choice, not a safety standard: with a wider radius the reading can fall on the
 * wrong street or on the wrong side of the evacuation area's edge. Computers and phones without
 * a GPS fix often report network positions accurate only to kilometers.
 */
export const LOW_ACCURACY_M = 100;

// Turn-by-turn navigation. Engineering choices for walking directions, not safety standards.

/** Distance before and after a route vertex used to judge a turn (ignores small curve vertices). */
export const NAV_TURN_LOOKAHEAD_M = 20;

/**
 * A first route segment shorter than this is the walk from the user's position to the nearest
 * street node; a turn there is GPS noise, not a real turn, so it is never announced.
 */
export const NAV_SNAP_SEGMENT_M = 20;

/** Closer than this, a turn is announced as "now" instead of "in N m". */
export const NAV_NOW_M = 30;

/** Within this distance of the meeting point the user has arrived (≈ GPS accuracy outdoors). */
export const ARRIVAL_RADIUS_M = 25;

/**
 * The DEMO walk (judges are not in Coronel) moves this many times faster than the average
 * healthy walking pace above, so a whole route fits in a short demo. Always labeled DEMO.
 */
export const DEMO_WALK_SPEEDUP = 10;

/**
 * Age bands printed on the profile cards (labels only: nothing is computed from a user's age,
 * and the age is never asked). Retrieved 2026-10-04 from Chile's Biblioteca del Congreso Nacional.
 *
 * Child: Ley 21.430, art. 1: "se entenderá por niño o niña a todo ser humano hasta los 14 años
 * de edad, y por adolescente a los mayores de 14 y menores de 18 años de edad."
 * https://www.bcn.cl/leychile/navegar?idNorma=1173643
 *
 * Older adult: Ley 19.828, art. 1: "llámase adulto mayor a toda persona que ha cumplido
 * sesenta años." https://www.bcn.cl/leychile/navegar?idNorma=202950
 */
export const PROFILE_AGE = {
  /** "Niño o niña": under 14 (from 14 on, the law says adolescent). */
  childUnder: 14,
  /** "Adulto mayor": 60 or older. */
  seniorFrom: 60,
} as const;

export const WALKING_SPEED_MPS = {
  averageHealthyAdult: mphToMetersPerSecond(4),
  mobilityImpaired: mphToMetersPerSecond(2),
} as const;
