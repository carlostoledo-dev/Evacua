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

function classify(angle: number): ManeuverKind | null {
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
 * The next maneuver along `path`. Turns are judged on the direction over the last and next
 * ~20 m around each vertex, so the many small vertices of a curved street do not count as turns.
 * The first, very short segment (from the user to the street network) is ignored for turns.
 */
export function nextManeuver(
  path: readonly P[],
  streets: readonly (string | null)[],
): Maneuver | null {
  if (path.length < 2) return null;
  const snap = haversineMeters(at(path, 0), at(path, 1));
  let walked = snap;
  for (let i = 1; i < path.length - 1; i++) {
    const vertex = at(path, i);
    const before = pointAlong(path, i, -NAV_TURN_LOOKAHEAD_M);
    const after = pointAlong(path, i, NAV_TURN_LOOKAHEAD_M);
    const kind = classify(turnAngle(bearingDegrees(before, vertex), bearingDegrees(vertex, after)));
    // The snap segment to the network is not a street: never announce a turn onto it.
    if (kind && !(i === 1 && snap < NAV_SNAP_SEGMENT_M)) {
      return { kind, meters: walked, street: streets[i] ?? null };
    }
    walked += haversineMeters(vertex, at(path, i + 1));
  }
  const current = streets.find((s, i) => i > 0 && s !== null) ?? null;
  return { kind: 'arrive', meters: walked, street: current };
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
