import { describe, expect, it } from 'vitest';
import { TRAIL_COST_FACTOR } from './constants.ts';
import { buildGraph, nearestNode } from './graph.ts';
import {
  planEvacuation,
  prepareRouting,
  shortestPathToAny,
  walkingTime,
  type MeetingPoint,
} from './routing.ts';

// Small synthetic town near Coronel (0.001° ≈ 89 m of longitude, 111 m of latitude here).
const LON = -73.15;
const LAT = -37.0;
const at = (dx: number, dy: number): [number, number] => [LON + dx, LAT + dy];

//   1 ──── 2
//   │      │           start = 0. A (node 3) is close by air but behind a "wall":
//   0      3 (A)       the only way there is 0 → 1 → 2 → 3.
//   │                  B (node 4) is farther by air but straight down the street 0 → 5 → 4.
//   5 ── 4 (B)         6–7 is a separate fragment (unreachable).
const nodes = [
  at(0, 0), // 0 start
  at(0, 0.003), // 1
  at(0.001, 0.003), // 2
  at(0.001, 0), // 3 = A
  at(-0.003, 0), // 4 = B
  at(-0.0025, 0), // 5
  at(0.0005, -0.0005), // 6 (fragment, ~60 m from start)
  at(0.0008, -0.0005), // 7 (fragment)
];
const edge = (a: number, b: number) => {
  const [ax = 0, ay = 0] = nodes[a] ?? [];
  const [bx = 0, by = 0] = nodes[b] ?? [];
  const meters = Math.hypot((bx - ax) * 88_800, (by - ay) * 111_000);
  return [a, b, meters];
};
const file = {
  nodes: nodes.flat(),
  edges: [edge(0, 1), edge(1, 2), edge(2, 3), edge(0, 5), edge(5, 4), edge(6, 7)].flat(),
};
const graph = buildGraph(file);

const A: MeetingPoint = { code: 'PE-A', coordinates: at(0.001, 0) };
const B: MeetingPoint = { code: 'PE-B', coordinates: at(-0.003, 0) };

const serviceArea = [LON - 0.01, LAT - 0.01, LON + 0.01, LAT + 0.01];
// Evacuation area: a box around the start that ends at dx = -0.002 (B side) and dx = 0.0009.
const evacuationArea = {
  type: 'Polygon' as const,
  coordinates: [
    [
      at(-0.002, -0.001),
      at(0.0009, -0.001),
      at(0.0009, 0.004),
      at(-0.002, 0.004),
      at(-0.002, -0.001),
    ],
  ],
};

describe('buildGraph / nearestNode', () => {
  it('stores each edge in both directions', () => {
    expect(graph.nodeCount).toBe(8);
    expect(graph.targets).toHaveLength(12);
    const neighbors = (n: number) =>
      Array.from(graph.targets.slice(graph.offsets[n], graph.offsets[n + 1]));
    expect(neighbors(0).sort()).toEqual([1, 5]);
    expect(neighbors(5).sort()).toEqual([0, 4]);
  });

  it('finds the closest node and its distance', () => {
    const near = nearestNode(graph, at(0.00001, 0.0029));
    expect(near?.index).toBe(1);
    expect(near?.meters).toBeLessThan(20);
  });
});

describe('shortestPathToAny', () => {
  it('picks the goal nearest by walking distance, not by air', () => {
    const result = shortestPathToAny(graph, 0, new Set([3, 4]));
    expect(result?.goal).toBe(4);
    expect(result?.nodes).toEqual([0, 5, 4]);
  });

  it('follows the detour when it is the only way', () => {
    const result = shortestPathToAny(graph, 0, new Set([3]));
    expect(result?.nodes).toEqual([0, 1, 2, 3]);
  });

  it('returns null for an unreachable goal or no goals', () => {
    expect(shortestPathToAny(graph, 0, new Set([7]))).toBeNull();
    expect(shortestPathToAny(graph, 0, new Set())).toBeNull();
  });
});

describe('shortestPathToAny with a node filter', () => {
  it('never walks through disallowed nodes', () => {
    const allowed = Uint8Array.from([1, 0, 1, 1, 1, 1, 1, 1]); // node 1 forbidden
    expect(shortestPathToAny(graph, 0, new Set([3]), allowed)).toBeNull();
    expect(shortestPathToAny(graph, 0, new Set([4]), allowed)?.nodes).toEqual([0, 5, 4]);
  });

  it('accepts goals as a 0/1 flag per node (many goals, plain Dijkstra)', () => {
    const goals = Uint8Array.from([0, 0, 1, 0, 0, 1, 0, 0]); // nodes 2 and 5
    expect(shortestPathToAny(graph, 0, goals)?.goal).toBe(5);
  });
});

describe('walkingTime', () => {
  it('gives a range from FEMA P-646 paces (4 mph and 2 mph), rounded up', () => {
    expect(walkingTime(1000)).toEqual({ fastestMinutes: 10, slowestMinutes: 19 });
    expect(walkingTime(10)).toEqual({ fastestMinutes: 1, slowestMinutes: 1 });
  });
});

describe('prepareRouting', () => {
  it('flags the nodes outside the evacuation area as safe', () => {
    const context = prepareRouting(graph, [evacuationArea]);
    // Inside the box: 0, 1, 6, 7. Outside: 2, 3 (east of it), 4, 5 (west of it).
    expect(Array.from(context.safeNodes)).toEqual([0, 0, 1, 1, 1, 1, 0, 0]);
  });
});

describe('planEvacuation (safety first)', () => {
  const context = prepareRouting(graph, [evacuationArea]);
  const base = { context, serviceArea, meetingPoints: [A, B] };

  it('refuses to route outside the pilot service area', () => {
    expect(planEvacuation({ ...base, start: at(0.05, 0) })).toEqual({
      kind: 'outside-service-area',
    });
  });

  it('takes the shortest way out of the area, then the nearest meeting point', () => {
    const plan = planEvacuation({ ...base, start: at(0, 0) });
    expect(plan.kind).toBe('route');
    if (plan.kind !== 'route') return;
    expect(plan.inDangerZone).toBe(true);
    expect(plan.destination).toMatchObject({ kind: 'meeting-point', code: 'PE-B' });
    expect(plan.path[0]).toEqual(at(0, 0));
    expect(plan.path.at(-1)).toEqual(B.coordinates);
    expect(plan.metersToSafety).toBeCloseTo(222, -1); // out at node 5
    expect(plan.meters).toBeCloseTo(266, -1);
    expect(plan.timeToSafety).toEqual(walkingTime(plan.metersToSafety ?? 0));
    expect(plan.time.slowestMinutes).toBeGreaterThanOrEqual(plan.time.fastestMinutes);
  });

  it('never sends you back through the evacuation area to reach a meeting point', () => {
    // Only A exists. From the safe exit (node 5), A is reachable only back through 0 and 1.
    const plan = planEvacuation({ ...base, meetingPoints: [A], start: at(0, 0) });
    expect(plan.kind).toBe('route');
    if (plan.kind !== 'route') return;
    expect(plan.destination.kind).toBe('safe-area');
    expect(plan.destination.coordinates).toEqual(at(-0.0025, 0));
    expect(plan.meters).toBeCloseTo(222, -1);
  });

  it('routes to a meeting point through safe ground when already outside the area', () => {
    const plan = planEvacuation({ ...base, start: at(-0.0026, 0) });
    expect(plan).toMatchObject({
      kind: 'route',
      inDangerZone: false,
      metersToSafety: null,
      destination: { kind: 'meeting-point', code: 'PE-B' },
    });
  });

  it('says you are already safe when no meeting point is reachable without re-entering', () => {
    const plan = planEvacuation({ ...base, meetingPoints: [B], start: at(0.001, 0.003) });
    expect(plan).toEqual({ kind: 'already-safe' });
  });

  it('falls back to a labeled straight line without a graph', () => {
    const plan = planEvacuation({
      ...base,
      context: prepareRouting(null, [evacuationArea]),
      start: at(0, 0),
    });
    expect(plan).toMatchObject({ kind: 'straight-line', reason: 'no-graph' });
    if (plan.kind === 'straight-line') {
      expect(plan.destination.code).toBe('PE-A');
      expect(plan.compass).toBe('E');
    }
  });

  it('falls back to a straight line when the start is far from any street', () => {
    const plan = planEvacuation({ ...base, start: at(0.006, 0.006) });
    expect(plan).toMatchObject({ kind: 'straight-line', reason: 'far-from-network' });
  });

  it('falls back to a straight line when there is no way out of the area', () => {
    // The 6–7 fragment lies entirely inside the evacuation area.
    const plan = planEvacuation({ ...base, start: at(0.0006, -0.0005) });
    expect(plan).toMatchObject({ kind: 'straight-line', reason: 'no-path', inDangerZone: true });
  });

  it('reports a missing destination when it cannot route and has no meeting point', () => {
    const plan = planEvacuation({
      ...base,
      context: prepareRouting(null, [evacuationArea]),
      meetingPoints: [],
      start: at(0, 0),
    });
    expect(plan).toEqual({ kind: 'no-destination', inDangerZone: true });
  });
});

describe('trails as a last resort', () => {
  //   2 ─────── 3        Street detour 0 → 2 → 3 → 1 (dy = `detour`); the direct way 0 → 5 → 1
  //   │         │        is a dirt trail, and so is the spur 1 → 6.
  //   0 ┄┄ 5 ┄┄ 1
  //             ┆
  //             6
  const trailTown = (detour: number) => {
    const points = [
      at(0, 0), // 0
      at(0.003, 0), // 1
      at(0, detour), // 2
      at(0.003, detour), // 3
      at(0.0015, 0.5), // 4 (unused, far away)
      at(0.0015, 0), // 5 (on the trail)
      at(0.003, -0.002), // 6 (end of the trail spur)
    ];
    const meters = (a: number, b: number) => {
      const [ax = 0, ay = 0] = points[a] ?? [];
      const [bx = 0, by = 0] = points[b] ?? [];
      return Math.hypot((bx - ax) * 88_800, (by - ay) * 111_000);
    };
    const pairs = [
      [0, 2],
      [2, 3],
      [3, 1],
      [0, 5],
      [5, 1],
      [1, 6],
    ];
    return buildGraph({
      nodes: points.flat(),
      edges: pairs.flatMap(([a = 0, b = 0]) => [a, b, meters(a, b)]),
      trailEdges: [3, 4, 5],
    });
  };
  const short = trailTown(0.002); // detour ≈ 711 m vs a 267 m trail: under the factor
  const long = trailTown(0.006); // detour ≈ 1 600 m: over the factor

  it('prefers a street detour up to TRAIL_COST_FACTOR times the trail', () => {
    expect(711 / 267).toBeLessThan(TRAIL_COST_FACTOR);
    const result = shortestPathToAny(short, 0, new Set([1]));
    expect(result?.nodes).toEqual([0, 2, 3, 1]);
    expect(result?.meters).toBeCloseTo(711, -1); // real meters, not the weighted cost
  });

  it('takes the trail when the street way is much longer, and reports it', () => {
    expect(shortestPathToAny(long, 0, new Set([1]))?.nodes).toEqual([0, 5, 1]);
    const plan = planEvacuation({
      context: prepareRouting(long, []),
      serviceArea,
      meetingPoints: [{ code: 'PE-T', coordinates: at(0.003, 0) }],
      start: at(0, 0),
    });
    expect(plan.kind).toBe('route');
    if (plan.kind !== 'route') return;
    expect(plan.segments).toEqual(['off-network', 'trail', 'trail', 'off-network']);
    expect(plan.segments).toHaveLength(plan.path.length - 1);
    expect(plan.trailMeters).toBeCloseTo(267, -1);
    expect(plan.meters).toBeCloseTo(267, -1);
  });

  it('may begin at a street node a little farther than the closest trail node', () => {
    const start = at(0.0015, 0.0013); // 144 m from trail node 5, 154 m from street node 2
    expect(nearestNode(short, start)?.index).toBe(5);
    const plan = planEvacuation({
      context: prepareRouting(short, []),
      serviceArea,
      meetingPoints: [{ code: 'PE-T', coordinates: at(0.003, 0) }],
      start,
    });
    expect(plan.kind).toBe('route');
    if (plan.kind !== 'route') return;
    expect(plan.trailMeters).toBe(0);
    expect(plan.segments).not.toContain('trail');
  });

  it('reaches a meeting point from its nearest street node rather than down a trail spur', () => {
    const point = at(0.0032, -0.0019); // ≈ 20 m from trail node 6, ≈ 211 m from street node 1
    expect(nearestNode(short, point)?.index).toBe(6);
    const plan = planEvacuation({
      context: prepareRouting(short, []),
      serviceArea,
      meetingPoints: [{ code: 'PE-T', coordinates: point }],
      start: at(0, 0.0001),
    });
    expect(plan).toMatchObject({ kind: 'route', trailMeters: 0 });
    if (plan.kind !== 'route') return;
    expect(plan.path.at(-2)).toEqual(at(0.003, 0));
    expect(plan.segments.at(-1)).toBe('off-network');
  });
});
