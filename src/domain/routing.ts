// Evacuation planning: pure functions, no browser APIs. Never returns a route without a data basis.
import { MAX_SNAP_DISTANCE_M, TRAIL_COST_FACTOR, WALKING_SPEED_MPS } from './constants.ts';
import {
  bearingDegrees,
  compassPoint,
  haversineMeters,
  insideBounds,
  insidePreparedArea,
  prepareArea,
  type AreaGeometry,
  type CompassPoint,
  type LonLat,
  type PreparedArea,
} from './geo.ts';
import { edgeIsTrail, edgeName, nearestNode, nodeCoordinates, type Graph } from './graph.ts';

// ---------------------------------------------------------------------------------------------
// Shortest paths (A* / Dijkstra) with several possible goals

class MinHeap {
  private readonly nodes: number[] = [];
  private readonly priorities: number[] = [];

  get size(): number {
    return this.nodes.length;
  }

  push(node: number, priority: number): void {
    this.nodes.push(node);
    this.priorities.push(priority);
    let i = this.nodes.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if ((this.priorities[parent] ?? 0) <= priority) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): number | undefined {
    const top = this.nodes[0];
    const lastNode = this.nodes.pop();
    const lastPriority = this.priorities.pop();
    if (this.nodes.length > 0 && lastNode !== undefined && lastPriority !== undefined) {
      this.nodes[0] = lastNode;
      this.priorities[0] = lastPriority;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (
          left < this.nodes.length &&
          (this.priorities[left] ?? 0) < (this.priorities[smallest] ?? 0)
        ) {
          smallest = left;
        }
        if (
          right < this.nodes.length &&
          (this.priorities[right] ?? 0) < (this.priorities[smallest] ?? 0)
        ) {
          smallest = right;
        }
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    [this.nodes[a], this.nodes[b]] = [this.nodes[b] ?? 0, this.nodes[a] ?? 0];
    [this.priorities[a], this.priorities[b]] = [this.priorities[b] ?? 0, this.priorities[a] ?? 0];
  }
}

export interface PathResult {
  goal: number;
  nodes: number[];
  /** Real walking distance (trails are weighted only to choose the path). */
  meters: number;
}

/** A node where a search may begin, and the meters walked off the network to reach it. */
export interface StartNode {
  node: number;
  meters: number;
}

/** Above this many goals the A* heuristic costs more than it saves; plain Dijkstra is used. */
const MAX_HEURISTIC_GOALS = 64;

/**
 * Shortest walking path from `start` to the nearest goal by network distance, where each meter of
 * trail counts TRAIL_COST_FACTOR times (streets first, trails only as a last resort).
 * `goals` is a set of node indices or a 0/1 flag per node. With a small goal set, A* uses the
 * straight-line distance to the closest goal (admissible, so the result stays optimal).
 * `start` is one node, or several with the meters walked to reach each (counted in the choice,
 * not in the returned `meters`); `nodes[0]` of the result is the one used.
 * `allowed`, when given, restricts which nodes may be walked through (the starts always are).
 */
export function shortestPathToAny(
  graph: Graph,
  start: number | readonly StartNode[],
  goals: ReadonlySet<number> | Uint8Array,
  allowed?: Uint8Array,
): PathResult | null {
  const isGoal =
    goals instanceof Uint8Array ? (n: number) => goals[n] === 1 : (n: number) => goals.has(n);
  if (!(goals instanceof Uint8Array) && goals.size === 0) return null;
  const goalCoords =
    goals instanceof Uint8Array || goals.size > MAX_HEURISTIC_GOALS
      ? []
      : [...goals].map((g) => nodeCoordinates(graph, g));
  const heuristic = (node: number) => {
    if (goalCoords.length === 0) return 0;
    const here = nodeCoordinates(graph, node);
    let best = Infinity;
    for (const goal of goalCoords) best = Math.min(best, haversineMeters(here, goal));
    return best;
  };

  const cost = new Float64Array(graph.nodeCount).fill(Infinity);
  const walked = new Float64Array(graph.nodeCount);
  const previous = new Int32Array(graph.nodeCount).fill(-1);
  const closed = new Uint8Array(graph.nodeCount);
  const open = new MinHeap();
  for (const { node, meters } of typeof start === 'number' ? [{ node: start, meters: 0 }] : start) {
    if (meters >= (cost[node] ?? Infinity)) continue;
    cost[node] = meters;
    open.push(node, meters + heuristic(node));
  }

  while (open.size > 0) {
    const node = open.pop() ?? -1;
    if (closed[node]) continue;
    closed[node] = 1;
    if (isGoal(node)) {
      const nodes = [node];
      for (let p = previous[node] ?? -1; p !== -1; p = previous[p] ?? -1) nodes.push(p);
      return { goal: node, nodes: nodes.reverse(), meters: walked[node] ?? 0 };
    }
    const base = cost[node] ?? 0;
    for (let k = graph.offsets[node] ?? 0; k < (graph.offsets[node + 1] ?? 0); k++) {
      const next = graph.targets[k] ?? 0;
      if (closed[next] || (allowed && allowed[next] !== 1)) continue;
      const meters = graph.meters[k] ?? 0;
      const candidate = base + (graph.trail[k] === 1 ? meters * TRAIL_COST_FACTOR : meters);
      if (candidate < (cost[next] ?? Infinity)) {
        cost[next] = candidate;
        walked[next] = (walked[node] ?? 0) + meters;
        previous[next] = node;
        open.push(next, candidate + heuristic(next));
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Evacuation plan

export interface MeetingPoint {
  code: string;
  coordinates: LonLat;
}

/** Walking time as a range: an average healthy pace and a mobility-impaired pace (FEMA P-646). */
export interface TimeRange {
  fastestMinutes: number;
  slowestMinutes: number;
}

export function walkingTime(meters: number): TimeRange {
  return {
    fastestMinutes: Math.max(1, Math.ceil(meters / WALKING_SPEED_MPS.averageHealthyAdult / 60)),
    slowestMinutes: Math.max(1, Math.ceil(meters / WALKING_SPEED_MPS.mobilityImpaired / 60)),
  };
}

export type Destination =
  | { kind: 'meeting-point'; code: string; coordinates: [number, number] }
  /** Outside the evacuation area, when no meeting point is reachable without re-entering it. */
  | { kind: 'safe-area'; coordinates: [number, number] };

export type SegmentKind = 'street' | 'trail' | 'off-network';

export type StraightLineReason = 'no-graph' | 'far-from-network' | 'no-path';

export type EvacuationPlan =
  | { kind: 'outside-service-area' }
  /** Already outside the evacuation area, with no safe-only walk to a meeting point. */
  | { kind: 'already-safe' }
  | {
      kind: 'route';
      inDangerZone: boolean;
      destination: Destination;
      /** [lon, lat] vertices from the user's position to the destination. */
      path: [number, number][];
      /** Street name of each path segment (path.length - 1 entries; null when unknown). */
      streets: (string | null)[];
      /**
       * How each path segment is walked (path.length - 1 entries): `street`, `trail` (dirt
       * track or trail) or `off-network` (from the position to the network, and from it to the
       * meeting point).
       */
      segments: SegmentKind[];
      /** Meters of the route on dirt tracks or trails (0 when it follows streets only). */
      trailMeters: number;
      meters: number;
      time: TimeRange;
      /** Walking distance until leaving the evacuation area; null when already outside. */
      metersToSafety: number | null;
      timeToSafety: TimeRange | null;
    }
  | {
      /** No route can be computed: only distance and direction, clearly labeled as such. */
      kind: 'straight-line';
      reason: StraightLineReason;
      inDangerZone: boolean;
      destination: Extract<Destination, { kind: 'meeting-point' }>;
      meters: number;
      bearing: number;
      compass: CompassPoint;
    }
  /** No route and not even a meeting point to point at. */
  | { kind: 'no-destination'; inDangerZone: boolean };

/** Precomputed once per commune: indexed evacuation areas and the safe flag of every node. */
export interface RoutingContext {
  graph: Graph | null;
  areas: readonly PreparedArea[];
  /** 1 = node outside every evacuation area. Empty when there is no graph. */
  safeNodes: Uint8Array;
  /** 1 = node on at least one way that is not a trail. Empty when there is no graph. */
  streetNodes: Uint8Array;
}

export function prepareRouting(
  graph: Graph | null,
  areas: readonly AreaGeometry[],
): RoutingContext {
  const prepared = areas.map(prepareArea);
  const safeNodes = new Uint8Array(graph?.nodeCount ?? 0);
  const streetNodes = new Uint8Array(graph?.nodeCount ?? 0);
  if (graph) {
    for (let i = 0; i < graph.nodeCount; i++) {
      const point = nodeCoordinates(graph, i);
      safeNodes[i] = prepared.some((area) => insidePreparedArea(point, area)) ? 0 : 1;
      for (let k = graph.offsets[i] ?? 0; k < (graph.offsets[i + 1] ?? 0); k++) {
        if (graph.trail[k] !== 1) streetNodes[i] = 1;
      }
    }
  }
  return { graph, areas: prepared, safeNodes, streetNodes };
}

export interface PlanInput {
  context: RoutingContext;
  start: LonLat;
  serviceArea: readonly number[];
  meetingPoints: readonly MeetingPoint[];
}

function lonLat(point: LonLat): [number, number] {
  return [point[0] ?? 0, point[1] ?? 0];
}

/**
 * Safety first, as SENAPRED asks ("prioriza la evacuación horizontal hacia un Punto de Encuentro
 * y/o Área de Seguridad"): from inside the evacuation area, take the shortest way out of it; then
 * continue to the nearest meeting point without walking back into the area.
 */
export function planEvacuation({
  context,
  start,
  serviceArea,
  meetingPoints,
}: PlanInput): EvacuationPlan {
  if (!insideBounds(start, serviceArea)) return { kind: 'outside-service-area' };
  const { graph, areas, safeNodes, streetNodes } = context;
  const inDangerZone = areas.some((area) => insidePreparedArea(start, area));

  const nearestByAir = meetingPoints.reduce<{ point: MeetingPoint; meters: number } | null>(
    (best, point) => {
      const meters = haversineMeters(start, point.coordinates);
      return best && best.meters <= meters ? best : { point, meters };
    },
    null,
  );
  const straightLine = (reason: StraightLineReason): EvacuationPlan => {
    if (!nearestByAir) return { kind: 'no-destination', inDangerZone };
    const bearing = bearingDegrees(start, nearestByAir.point.coordinates);
    return {
      kind: 'straight-line',
      reason,
      inDangerZone,
      destination: {
        kind: 'meeting-point',
        code: nearestByAir.point.code,
        coordinates: lonLat(nearestByAir.point.coordinates),
      },
      meters: nearestByAir.meters,
      bearing,
      compass: compassPoint(bearing),
    };
  };

  if (!graph) return straightLine('no-graph');
  const startSnap = nearestNode(graph, start);
  if (!startSnap || startSnap.meters > MAX_SNAP_DISTANCE_M) return straightLine('far-from-network');
  // The closest node may be on a trail while a street is only a little farther: the search may
  // begin at either, counting the walk to each, so a nearby trail does not force the route on it.
  const starts: StartNode[] = [{ node: startSnap.index, meters: startSnap.meters }];
  if (streetNodes[startSnap.index] !== 1) {
    const streetSnap = nearestNode(graph, start, (i) => streetNodes[i] === 1);
    if (streetSnap && streetSnap.meters <= MAX_SNAP_DISTANCE_M) {
      starts.push({ node: streetSnap.index, meters: streetSnap.meters });
    }
  }

  // Meeting points, reached through their nearest network node, or through their nearest street
  // node when the closest one is on a trail (so a trail is not forced on the last stretch).
  const goalToPoint = new Map<number, { point: MeetingPoint; snapMeters: number }>();
  for (const point of meetingPoints) {
    const snap = nearestNode(graph, point.coordinates);
    const snaps =
      snap && streetNodes[snap.index] !== 1
        ? [snap, nearestNode(graph, point.coordinates, (i) => streetNodes[i] === 1)]
        : [snap];
    for (const candidate of snaps) {
      if (
        candidate &&
        candidate.meters <= MAX_SNAP_DISTANCE_M &&
        !goalToPoint.has(candidate.index)
      ) {
        goalToPoint.set(candidate.index, { point, snapMeters: candidate.meters });
      }
    }
  }

  const goals = new Set(goalToPoint.keys());
  let exit: PathResult;
  let onward: PathResult | null;
  if (inDangerZone) {
    // 1) Inside the area: the shortest way out.
    const out = shortestPathToAny(graph, starts, safeNodes);
    if (!out) return straightLine('no-path');
    exit = out;
    // 2) From there, the nearest meeting point through safe nodes only.
    onward = shortestPathToAny(graph, exit.goal, goals, safeNodes);
  } else {
    // Outside: straight to the nearest meeting point through safe nodes only.
    onward = shortestPathToAny(graph, starts, goals, safeNodes);
    const first = onward?.nodes[0] ?? startSnap.index;
    exit = { goal: first, nodes: [first], meters: 0 };
  }
  const reached = onward ? goalToPoint.get(onward.goal) : undefined;
  if (!inDangerZone && (!onward || !reached)) return { kind: 'already-safe' };
  const snapMeters = starts.find((s) => s.node === exit.nodes[0])?.meters ?? startSnap.meters;

  const path: [number, number][] = [
    lonLat(start),
    ...exit.nodes.map((node) => nodeCoordinates(graph, node)),
  ];
  // The walk from the position to the network, and from it to a meeting point, has no street.
  const streets: (string | null)[] = [null];
  const segments: SegmentKind[] = ['off-network'];
  let trailMeters = 0;
  const nameSteps = (nodes: readonly number[]) => {
    for (let i = 1; i < nodes.length; i++) {
      const from = nodes[i - 1] ?? -1;
      const to = nodes[i] ?? -1;
      streets.push(edgeName(graph, from, to));
      const trail = edgeIsTrail(graph, from, to);
      segments.push(trail ? 'trail' : 'street');
      if (trail) {
        trailMeters += haversineMeters(nodeCoordinates(graph, from), nodeCoordinates(graph, to));
      }
    }
  };
  nameSteps(exit.nodes);
  let meters = snapMeters + exit.meters;
  let destination: Destination = {
    kind: 'safe-area',
    coordinates: nodeCoordinates(graph, exit.goal),
  };
  if (onward && reached) {
    path.push(...onward.nodes.slice(1).map((node) => nodeCoordinates(graph, node)));
    nameSteps(onward.nodes);
    path.push(lonLat(reached.point.coordinates));
    streets.push(null);
    segments.push('off-network');
    meters += onward.meters + reached.snapMeters;
    destination = {
      kind: 'meeting-point',
      code: reached.point.code,
      coordinates: lonLat(reached.point.coordinates),
    };
  }

  const metersToSafety = inDangerZone ? snapMeters + exit.meters : null;
  return {
    kind: 'route',
    inDangerZone,
    destination,
    path,
    streets,
    segments,
    trailMeters,
    meters,
    time: walkingTime(meters),
    metersToSafety,
    timeToSafety: metersToSafety === null ? null : walkingTime(metersToSafety),
  };
}
