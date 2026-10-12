// The data that ships with the app, validated through the same loader the browser uses.
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadCommune, loadRegistry, type CommuneData } from '../src/data/loader.ts';
import { routingInputs } from '../src/data/routing-inputs.ts';
import { buildGraph } from '../src/domain/graph.ts';
import { pathMeters, positionAlong } from '../src/domain/navigation.ts';
import { planEvacuation, prepareRouting } from '../src/domain/routing.ts';
import { planningArea } from '../src/ui/hooks/useEvacuationPlan.ts';
import { arrivalAt } from '../src/ui/hooks/useNavigation.ts';
import { fsFetcher } from '../scripts/lib/fs-fetcher.ts';

const registryUrl = pathToFileURL('public/data/communes/index.json').href;

async function loadShipped(id: string): Promise<CommuneData> {
  const result = await loadCommune(fsFetcher, new URL(`${id}/manifest.json`, registryUrl).href);
  if (!result.ok) throw new Error(`${result.error.kind}: ${result.error.issues.join('; ')}`);
  return result.value;
}

describe('shipped data', () => {
  it('has a valid registry whose communes all load', async () => {
    const registry = await loadRegistry(fsFetcher, registryUrl);
    expect(registry.ok).toBe(true);
    if (!registry.ok) return;
    for (const commune of registry.value.communes) {
      await expect(loadShipped(commune.id)).resolves.toBeDefined();
    }
  });

  it('Coronel pilot area: every tsunami layer comes from the verified SENAPRED source', async () => {
    const { manifest, layers } = await loadShipped('coronel');
    expect(manifest.sector.id).toBe('piloto-coronel');
    expect(layers.map((l) => l.entry.role).sort()).toEqual([
      'evacuation-area',
      'evacuation-route',
      'meeting-point',
      'safe-line',
    ]);
    for (const layer of layers) {
      expect(layer.status, layer.entry.id).toBe('verified');
      expect(layer.source.publisher).toContain('SENAPRED');
      for (const feature of layer.collection.features) {
        expect(feature.properties.retrievedAt).toBe(layer.source.retrievedAt);
      }
    }
  });

  it('Coronel pilot area: meeting points lie inside the data bounds', async () => {
    const { manifest, layers } = await loadShipped('coronel');
    const [west, south, east, north] = manifest.bounds;
    const points = layers.find((l) => l.entry.role === 'meeting-point');
    expect(points).toBeDefined();
    for (const feature of points?.collection.features ?? []) {
      if (feature.geometry.type !== 'Point') continue;
      const [lon, lat] = feature.geometry.coordinates;
      expect(lon).toBeGreaterThanOrEqual(west);
      expect(lon).toBeLessThanOrEqual(east);
      expect(lat).toBeGreaterThanOrEqual(south);
      expect(lat).toBeLessThanOrEqual(north);
    }
  });

  it('Coronel pilot area: each DEMO location behaves as its label says', async () => {
    const { manifest, layers, graph } = await loadShipped('coronel');
    expect(graph).not.toBeNull();
    const { evacuationAreas, meetingPoints } = routingInputs(layers);
    expect(meetingPoints.length).toBeGreaterThan(0);
    const context = prepareRouting(
      graph ? buildGraph(graph) : null,
      evacuationAreas,
      manifest.bounds,
    );
    const plans = Object.fromEntries(
      manifest.demoLocations.map((demo) => [
        demo.id,
        planEvacuation({
          context,
          start: demo.coordinates,
          serviceArea: manifest.sector.serviceArea,
          meetingPoints,
        }),
      ]),
    );

    // Print a compact summary when a label and the data disagree.
    const summary = Object.fromEntries(
      Object.entries(plans).map(([id, plan]) => [
        id,
        plan.kind === 'route' ? `route inDanger=${String(plan.inDangerZone)}` : plan.kind,
      ]),
    );
    expect(summary).toEqual({
      'yobilo-villa-mora': 'route inDanger=true',
      'villa-la-pena': 'route inDanger=true',
      'nuevo-horizonte': 'route inDanger=false',
      lagunillas: 'route inDanger=true',
      'coronel-centro': 'route inDanger=true',
      'outside-pilot': 'outside-service-area',
    });
    const yobilo = plans['yobilo-villa-mora'];
    if (yobilo?.kind === 'route') {
      expect(yobilo.metersToSafety).toBeGreaterThan(0);
      expect(yobilo.metersToSafety).toBeLessThan(yobilo.meters);
    }
  });

  // Walks a route the way the DEMO walk does, re-planning from each new position.
  it('Coronel pilot area: a started route stays on screen until the user arrives', async () => {
    const { manifest, layers, graph } = await loadShipped('coronel');
    const { evacuationAreas, meetingPoints } = routingInputs(layers);
    const context = prepareRouting(
      graph ? buildGraph(graph) : null,
      evacuationAreas,
      manifest.bounds,
    );
    const plan = (start: [number, number], navigating: boolean) =>
      planEvacuation({
        context,
        start,
        serviceArea: planningArea(manifest, navigating),
        meetingPoints,
      });
    const walk = (start: [number, number], navigating: boolean) => {
      const first = plan(start, false);
      if (first.kind !== 'route') throw new Error(`no route from ${String(start)}`);
      const kinds = new Set<string>();
      const length = pathMeters(first.path);
      let end: [number, number] = start;
      for (let walked = 0; walked < length; walked = Math.min(length, walked + 25)) {
        end = positionAlong(first.path, Math.min(length, walked + 25));
        kinds.add(plan(end, navigating).kind);
      }
      return { first, kinds, arrived: arrivalAt(end, plan(end, navigating)) };
    };

    // Inside the pilot area, toward meeting point PE033, which lies just outside it.
    const toOutside = walk([-73.12966, -36.98025], true);
    expect(toOutside.first.destination).toMatchObject({
      code: '08102PE033',
    });
    expect([...toOutside.kinds]).toEqual(['route']);
    expect(toOutside.arrived?.kind).toBe('meeting-point');
    // Before the fix, the same walk said "outside the pilot area" halfway.
    expect(walk([-73.12966, -36.98025], false).kinds.has('outside-service-area')).toBe(true);

    // No meeting point reachable: the route to safe ground arrives where the area ends.
    const toSafeGround = walk([-73.16524, -36.98435], true);
    expect(toSafeGround.first.destination.kind).toBe('safe-area');
    expect(toSafeGround.arrived?.kind).toBe('safe-area');
  });
});
