// Reproducible pedestrian network for one commune, from OpenStreetMap (ODbL).
//
//   npm run data:graph            (commune "coronel")
//
// Downloads walkable ways inside the commune's data bounds (plus a margin) from the Overpass
// API, keeps the largest connected component, and writes a compact graph file:
//   nodes: [lon, lat, …]   edges: [from, to, meters, …]
//   names: [street name, …]   edgeNames: [index into names or -1, one per edge]
// The manifest's `graph` entry records source, license and retrieval date.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { haversineMeters } from '../src/domain/geo.ts';
import { boundsSchema, formatIssues, graphFileSchema, manifestSchema } from '../src/data/schema.ts';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const MARGIN_DEGREES = 0.004; // ≈ 400 m, so streets just outside the bounds still connect
const GRAPH_FILE = 'graph.json';
const COORDINATE_DECIMALS = 5; // ≈ 1 m: plenty for walking directions, smaller file

// Ways a person can walk on. Motorways are excluded; private or foot=no ways are filtered out.
// `track` (forestry and farm tracks) and `path` (trails, mostly untagged dirt paths) are
// excluded too: in Coronel they cross the wooded hills, and an evacuation route must follow
// streets, sidewalks and stairs people know and can use at night (owner report 2026-10-07: a
// route went over the hill on dirt tracks; with them excluded no route uses a trail).
const WALKABLE =
  'footway|pedestrian|living_street|residential|service|unclassified|road|steps|' +
  'cycleway|tertiary|tertiary_link|secondary|secondary_link|primary|primary_link|trunk|trunk_link';

interface OverpassElement {
  type: 'node' | 'way';
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

function round(value: number): number {
  return Number(value.toFixed(COORDINATE_DECIMALS));
}

async function main(): Promise<void> {
  const communeId = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'coronel';
  const communeDir = path.join('public', 'data', 'communes', communeId);
  const manifestPath = path.join(communeDir, 'manifest.json');
  const manifestJson = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
  const boundsResult = boundsSchema.safeParse(manifestJson.bounds);
  if (!boundsResult.success) throw new Error(formatIssues(boundsResult.error).join('\n'));
  const [west, south, east, north] = boundsResult.data;

  const bbox = [
    south - MARGIN_DEGREES,
    west - MARGIN_DEGREES,
    north + MARGIN_DEGREES,
    east + MARGIN_DEGREES,
  ]
    .map(String)
    .join(',');
  const query = `[out:json][timeout:120];
way["highway"~"^(${WALKABLE})$"]["access"!~"^(private|no)$"]["foot"!~"^no$"](${bbox});
(._;>;);
out body qt;`;
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Evacua/0.1 (hackathon data build)',
    },
    body: new URLSearchParams({ data: query }).toString(),
  });
  if (!response.ok) throw new Error(`Overpass HTTP ${String(response.status)}`);
  const { elements } = (await response.json()) as { elements: OverpassElement[] };

  const coords = new Map<number, [number, number]>();
  for (const el of elements) {
    if (el.type === 'node' && el.lon !== undefined && el.lat !== undefined)
      coords.set(el.id, [el.lon, el.lat]);
  }

  // Undirected adjacency keyed by OSM node id.
  const adjacency = new Map<number, Set<number>>();
  const link = (a: number, b: number) => {
    if (a === b || !coords.has(a) || !coords.has(b)) return;
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  };
  // Street name per node pair (the first named way wins), for turn-by-turn directions.
  const pairName = new Map<string, string>();
  const pairKey = (a: number, b: number) =>
    a < b ? `${String(a)}-${String(b)}` : `${String(b)}-${String(a)}`;
  for (const el of elements) {
    if (el.type !== 'way' || !el.nodes) continue;
    const name = el.tags?.name?.trim();
    for (let i = 1; i < el.nodes.length; i++) {
      const a = el.nodes[i - 1] ?? -1;
      const b = el.nodes[i] ?? -1;
      link(a, b);
      if (name && !pairName.has(pairKey(a, b))) pairName.set(pairKey(a, b), name);
    }
  }

  // Keep the largest connected component: isolated fragments cannot lead anywhere useful.
  const seen = new Set<number>();
  let largest: number[] = [];
  for (const start of adjacency.keys()) {
    if (seen.has(start)) continue;
    const component: number[] = [];
    const stack = [start];
    seen.add(start);
    while (stack.length > 0) {
      const id = stack.pop() ?? -1;
      component.push(id);
      for (const next of adjacency.get(id) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    if (component.length > largest.length) largest = component;
  }

  const index = new Map<number, number>();
  const nodes: number[] = [];
  for (const id of largest) {
    const [lon, lat] = coords.get(id) ?? [0, 0];
    index.set(id, nodes.length / 2);
    nodes.push(round(lon), round(lat));
  }
  const edges: number[] = [];
  const names: string[] = [];
  const nameIds = new Map<string, number>();
  const edgeNames: number[] = [];
  for (const id of largest) {
    for (const next of adjacency.get(id) ?? []) {
      if (id >= next) continue; // each undirected edge once
      const from = index.get(id);
      const to = index.get(next);
      if (from === undefined || to === undefined) continue;
      const a = coords.get(id) ?? [0, 0];
      const b = coords.get(next) ?? [0, 0];
      edges.push(from, to, Math.max(1, Math.round(haversineMeters(a, b))));
      const name = pairName.get(pairKey(id, next));
      if (name !== undefined && !nameIds.has(name)) {
        nameIds.set(name, names.length);
        names.push(name);
      }
      edgeNames.push(name === undefined ? -1 : (nameIds.get(name) ?? -1));
    }
  }

  const graph = graphFileSchema.parse({ schemaVersion: 1, nodes, edges, names, edgeNames });
  await writeFile(path.join(communeDir, GRAPH_FILE), `${JSON.stringify(graph)}\n`);

  const graphEntry = {
    file: GRAPH_FILE,
    source: 'OpenStreetMap walkable ways via the Overpass API',
    sourceUrl: 'https://www.openstreetmap.org/copyright',
    license: 'ODbL-1.0 (© OpenStreetMap contributors)',
    retrievedAt: new Date().toISOString().slice(0, 10),
  };
  const updated = manifestSchema.safeParse({ ...manifestJson, graph: graphEntry });
  if (!updated.success) throw new Error(formatIssues(updated.error).join('\n'));
  await writeFile(
    manifestPath,
    `${JSON.stringify({ ...manifestJson, graph: graphEntry }, null, 2)}\n`,
  );
  console.log(
    `graph: ${String(nodes.length / 2)} nodes, ${String(edges.length / 3)} edges (largest component of ${String(adjacency.size)} nodes)`,
  );
}

await main();
