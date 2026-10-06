// In-memory pedestrian graph in compressed sparse row (CSR) form: compact and fast on phones.
import { haversineMeters, type LonLat } from './geo.ts';

export interface Graph {
  nodeCount: number;
  lon: Float64Array;
  lat: Float64Array;
  /** Neighbors of node i are targets[offsets[i] .. offsets[i + 1]). */
  offsets: Uint32Array;
  targets: Uint32Array;
  meters: Float32Array;
  /** Street names, and for each slot the index of its edge's name (-1: unnamed). */
  names: readonly string[];
  nameIndex: Int32Array;
}

/** Builds an undirected CSR graph from the compact file format ([lon, lat…], [from, to, m…]). */
export function buildGraph(file: {
  nodes: readonly number[];
  edges: readonly number[];
  names?: readonly string[] | undefined;
  edgeNames?: readonly number[] | undefined;
}): Graph {
  const nodeCount = file.nodes.length / 2;
  const lon = new Float64Array(nodeCount);
  const lat = new Float64Array(nodeCount);
  for (let i = 0; i < nodeCount; i++) {
    lon[i] = file.nodes[2 * i] ?? 0;
    lat[i] = file.nodes[2 * i + 1] ?? 0;
  }

  const degree = new Uint32Array(nodeCount);
  for (let e = 0; e < file.edges.length; e += 3) {
    const from = file.edges[e] ?? 0;
    const to = file.edges[e + 1] ?? 0;
    degree[from] = (degree[from] ?? 0) + 1;
    degree[to] = (degree[to] ?? 0) + 1;
  }
  const offsets = new Uint32Array(nodeCount + 1);
  for (let i = 0; i < nodeCount; i++) offsets[i + 1] = (offsets[i] ?? 0) + (degree[i] ?? 0);

  const total = offsets[nodeCount] ?? 0;
  const targets = new Uint32Array(total);
  const meters = new Float32Array(total);
  const nameIndex = new Int32Array(total).fill(-1);
  const cursor = offsets.slice(0, nodeCount);
  const add = (from: number, to: number, m: number, name: number) => {
    const slot = cursor[from] ?? 0;
    targets[slot] = to;
    meters[slot] = m;
    nameIndex[slot] = name;
    cursor[from] = slot + 1;
  };
  for (let e = 0; e < file.edges.length; e += 3) {
    const from = file.edges[e] ?? 0;
    const to = file.edges[e + 1] ?? 0;
    const m = file.edges[e + 2] ?? 0;
    const name = file.edgeNames?.[e / 3] ?? -1;
    add(from, to, m, name);
    add(to, from, m, name);
  }
  return { nodeCount, lon, lat, offsets, targets, meters, names: file.names ?? [], nameIndex };
}

/** Name of the street joining two adjacent nodes, or null when unnamed or not adjacent. */
export function edgeName(graph: Graph, from: number, to: number): string | null {
  for (let k = graph.offsets[from] ?? 0; k < (graph.offsets[from + 1] ?? 0); k++) {
    if (graph.targets[k] === to) return graph.names[graph.nameIndex[k] ?? -1] ?? null;
  }
  return null;
}

export function nodeCoordinates(graph: Graph, index: number): [number, number] {
  return [graph.lon[index] ?? 0, graph.lat[index] ?? 0];
}

/** Closest graph node to `point`, with its distance in meters; null for an empty graph. */
export function nearestNode(graph: Graph, point: LonLat): { index: number; meters: number } | null {
  const [lon = 0, lat = 0] = point;
  // Fast pre-selection with an equirectangular approximation, then one exact distance.
  const cosLat = Math.cos((lat * Math.PI) / 180);
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < graph.nodeCount; i++) {
    const dx = ((graph.lon[i] ?? 0) - lon) * cosLat;
    const dy = (graph.lat[i] ?? 0) - lat;
    const score = dx * dx + dy * dy;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  if (best < 0) return null;
  return { index: best, meters: haversineMeters(point, nodeCoordinates(graph, best)) };
}
