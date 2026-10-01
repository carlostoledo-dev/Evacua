// The data that ships with the app, validated through the same loader the browser uses.
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadCommune, loadRegistry, type CommuneData } from '../src/data/loader.ts';
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

  it('Coronel / Yobilo: every tsunami layer comes from the verified SENAPRED source', async () => {
    const { manifest, layers } = await loadShipped('coronel');
    expect(manifest.sector.id).toBe('yobilo');
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

  it('Coronel / Yobilo: meeting points lie inside the data bounds', async () => {
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
});
