// Turn-by-turn guidance from a planned route: what to do next, and in how many meters.
// Pure geometry over the route's vertices; the route itself always starts at the user, because
// the plan is recomputed from every new position (so going off route simply re-plans).
import { NAV_SNAP_SEGMENT_M, NAV_TURN_LOOKAHEAD_M } from './constants.ts';
import { bearingDegrees, haversineMeters } from './geo.ts';

export type ManeuverKind =
  | 'slight-left'
  | 'slight-right'
  | 'left'
  | 'right'
  | 'sharp-left'
  | 'sharp-right'
  /** No turn left before the destination: keep going until you arrive. */
  | 'arrive';

export interface Maneuver {
  kind: ManeuverKind;
  /** Walking distance from the user to where the maneuver happens. */
  meters: number;
  /** Street to take after the maneuver (or the current one for "arrive"); null if unknown. */
  street: string | null;
}

type P = [number, number];

/** Vertex `i` of a path (callers stay within bounds; the fallback only satisfies the types). */
function at(path: readonly P[], i: number): P {
  return path[i] ?? [0, 0];
}

/** Signed turn in degrees, -180..180 (positive = right). */
function turnAngle(inBearing: number, outBearing: number): number {
  return ((outBearing - inBearing + 540) % 360) - 180;
}

function classify(angle: number): Exclude<ManeuverKind, 'arrive'> | null {
  const a = Math.abs(angle);
  if (a < 30) return null; // a bend, not a turn
  const side = angle > 0 ? 'right' : 'left';
  if (a < 60) return `slight-${side}`;
  if (a < 135) return side;
  return `sharp-${side}`;
}

/** Point `meters` along the polyline from vertex `from`, walking forwards (+) or backwards (-). */
function pointAlong(path: readonly P[], from: number, meters: number): P {
  const step = meters >= 0 ? 1 : -1;
  let left = Math.abs(meters);
  let i = from;
  while (i + step >= 0 && i + step < path.length) {
    const a = at(path, i);
    const b = at(path, i + step);
    const d = haversineMeters(a, b);
    if (d >= left) {
      const t = d === 0 ? 0 : left / d;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    left -= d;
    i += step;
  }
  return at(path, i);
}

/**
 * Every maneuver along `path`, in order, ending with "arrive" (keep going to the destination).
 * Turns are judged on the direction over the last and next ~20 m around each vertex, so the many
 * small vertices of a curved street do not count as turns. The first, very short segment (from
 * the user to the street network) is ignored for turns. Distances are from the path's start.
 */
export function maneuvers(path: readonly P[], streets: readonly (string | null)[]): Maneuver[] {
  if (path.length < 2) return [];
  const list: Maneuver[] = [];
  const snap = haversineMeters(at(path, 0), at(path, 1));
  let walked = snap;
  for (let i = 1; i < path.length - 1; i++) {
    const vertex = at(path, i);
    const before = pointAlong(path, i, -NAV_TURN_LOOKAHEAD_M);
    const after = pointAlong(path, i, NAV_TURN_LOOKAHEAD_M);
    const kind = classify(turnAngle(bearingDegrees(before, vertex), bearingDegrees(vertex, after)));
    // The snap segment to the network is not a street: never announce a turn onto it.
    if (kind && !(i === 1 && snap < NAV_SNAP_SEGMENT_M)) {
      list.push({ kind, meters: walked, street: streets[i] ?? null });
    }
    walked += haversineMeters(vertex, at(path, i + 1));
  }
  const last = [...streets].reverse().find((s) => s !== null) ?? null;
  list.push({ kind: 'arrive', meters: walked, street: list.length > 0 ? last : streetOf(streets) });
  return list;
}

/** One street of a route, for the "how to get there" summary. */
export interface StreetLeg {
  street: string | null;
  meters: number;
  /** Turn taken onto this street from the previous one; null for the first leg or straight on. */
  turn: Exclude<ManeuverKind, 'arrive'> | null;
}

/** Legs shorter than this are folded into the previous one (crossings, short connectors). */
const MIN_LEG_M = 40;

/**
 * The route as a few legs, one per street: consecutive segments of the same street (or of an
 * unnamed path) are merged, very short legs fold into the previous one, and each leg says how
 * to turn onto it. Far fewer lines than every bend of the geometry.
 */
export function streetLegs(path: readonly P[], streets: readonly (string | null)[]): StreetLeg[] {
  const groups: { street: string | null; meters: number; from: number; to: number }[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const meters = haversineMeters(at(path, i), at(path, i + 1));
    const street = streets[i] ?? null;
    const last = groups.at(-1);
    if (last && (street === null || street === last.street || last.meters < MIN_LEG_M)) {
      // A short leg (a connector) takes the name of the street it leads to.
      if (street !== null && street !== last.street && last.meters < MIN_LEG_M) {
        last.street = street;
      }
      last.meters += meters;
      last.to = i + 1;
    } else {
      groups.push({ street, meters, from: i, to: i + 1 });
    }
  }
  // A short leg at the end joins the one before it.
  const tail = groups.at(-1);
  if (groups.length > 1 && tail && tail.meters < MIN_LEG_M) {
    const before = groups.at(-2);
    if (before) {
      before.meters += tail.meters;
      before.to = tail.to;
      groups.pop();
    }
  }
  return groups.map((group, index) => {
    if (index === 0) return { street: group.street, meters: group.meters, turn: null };
    const corner = at(path, group.from);
    const before = pointAlong(path, group.from, -NAV_TURN_LOOKAHEAD_M);
    const after = pointAlong(path, group.from, NAV_TURN_LOOKAHEAD_M);
    const turn = classify(turnAngle(bearingDegrees(before, corner), bearingDegrees(corner, after)));
    return { street: group.street, meters: group.meters, turn };
  });
}

/** The street the walk starts on (the snap segment has none). */
function streetOf(streets: readonly (string | null)[]): string | null {
  return streets.find((s, i) => i > 0 && s !== null) ?? null;
}

/** The next maneuver along `path` (see `maneuvers`). */
export function nextManeuver(
  path: readonly P[],
  streets: readonly (string | null)[],
): Maneuver | null {
  return maneuvers(path, streets)[0] ?? null;
}

/** Point `meters` along the route from its start (the end of the route if it is shorter). */
export function positionAlong(path: readonly P[], meters: number): P {
  return path.length === 0 ? [0, 0] : pointAlong(path, 0, meters);
}

/** Length of the route in meters. */
export function pathMeters(path: readonly P[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += haversineMeters(at(path, i - 1), at(path, i));
  return total;
}

/** Direction the user should walk now: from them to a point a few meters along the route. */
export function headingAlong(path: readonly P[]): number | null {
  if (path.length < 2) return null;
  const ahead = pointAlong(path, 0, NAV_TURN_LOOKAHEAD_M);
  const start = at(path, 0);
  if (haversineMeters(start, ahead) < 1) return null;
  return bearingDegrees(start, ahead);
}
