// Test-only builders for small, valid data files. Values are clearly fake (example.org).
import type { Fetcher } from '../loader.ts';

export const BASE = 'https://evacua.test/data/communes/';
export const REGISTRY_URL = `${BASE}index.json`;

export function source(overrides: Record<string, unknown> = {}) {
  return {
    id: 'demo-source',
    name: 'Demo source',
    publisher: 'Evacua tests',
    url: 'https://example.org/data',
    license: 'CC0-1.0',
    retrievedAt: '2026-10-01',
    verified: false,
    ...overrides,
  };
}

export function meta(overrides: Record<string, unknown> = {}) {
  return {
    source: 'Demo source',
    sourceUrl: 'https://example.org/data/points',
    retrievedAt: '2026-10-01',
    license: 'CC0-1.0',
    verified: false,
    ...overrides,
  };
}

export function meetingPoints(metaOverrides: Record<string, unknown> = {}) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-73.15, -37.0] },
        properties: { code: 'PE001', name: null, ...meta(metaOverrides) },
      },
    ],
  };
}

export function manifest(id: string, overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    id,
    name: id,
    region: 'Test region',
    country: 'CL',
    sector: {
      id: 'pilot',
      name: 'Pilot',
      serviceArea: [-73.16, -37.01, -73.14, -36.99],
      note: 'Test service area.',
    },
    bounds: [-73.2, -37.05, -73.1, -36.95],
    basemap: {
      tiles: `/tiles/${id}/{z}/{x}/{y}.mvt`,
      minzoom: 12,
      maxzoom: 15,
      attribution: '© OpenStreetMap contributors',
      source: 'Test tiles',
      license: 'ODbL-1.0',
      retrievedAt: '2026-10-01',
    },
    layers: [
      {
        id: 'meeting-points',
        role: 'meeting-point',
        hazards: ['tsunami'],
        file: 'layers/meeting-points.geojson',
        sourceId: 'demo-source',
      },
    ],
    sources: [source()],
    ...overrides,
  };
}

export function registry(ids: string[], defaultCommune = ids[0]) {
  return {
    schemaVersion: 1,
    defaultCommune,
    communes: ids.map((id) => ({ id, manifest: `${id}/manifest.json` })),
  };
}

/** A body to serve, an HTTP status to return, or 'network-error' to make fetch reject. */
export type FakeFile = unknown;

/** Serves JSON bodies by absolute URL; unknown URLs answer 404. */
export function fakeFetcher(files: Record<string, FakeFile>): Fetcher {
  return (url) => {
    if (!(url in files)) return Promise.resolve(new Response(null, { status: 404 }));
    const body = files[url];
    if (body === 'network-error') return Promise.reject(new TypeError('Failed to fetch'));
    if (typeof body === 'number') return Promise.resolve(new Response(null, { status: body }));
    if (typeof body === 'string') return Promise.resolve(new Response(body));
    return Promise.resolve(new Response(JSON.stringify(body)));
  };
}

/** Registry + one or more valid communes, each with one meeting-point layer. */
export function communeFiles(ids: string[]): Record<string, FakeFile> {
  const files: Record<string, FakeFile> = { [REGISTRY_URL]: registry(ids) };
  for (const id of ids) {
    files[`${BASE}${id}/manifest.json`] = manifest(id);
    files[`${BASE}${id}/layers/meeting-points.geojson`] = meetingPoints();
  }
  return files;
}
