// Reproducible import of SENAPRED's official tsunami layers for one commune.
//
//   npm run data:import            (commune "coronel", today's date)
//   node scripts/import-senapred.ts coronel --date=2026-10-01
//
// Reads the commune manifest for the data bounds and the source entry, downloads each layer
// from SENAPRED's public FeatureServer as GeoJSON, keeps only the fields the app needs, stamps
// provenance metadata on every feature, validates with the app's own schemas, and writes the
// layer files. Nothing is invented: features are copied; the evacuation area and the safe line
// are only clipped to the data bounds.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { bboxClip } from '@turf/bbox-clip';
import { checkLayerConsistency } from '../src/data/consistency.ts';
import {
  formatIssues,
  layerSchemas,
  manifestSchema,
  type Bounds,
  type LayerRole,
  type Source,
} from '../src/data/schema.ts';

const SOURCE_ID = 'senapred-tsunami-2024';
const COORDINATE_DECIMALS = 6; // ~0.1 m, far below the source's own precision

type RawProperties = Record<string, unknown>;

interface LayerImport {
  index: number;
  clipToBounds: boolean;
  properties: (raw: RawProperties) => Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`expected text, got ${String(value)}`);
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

// FeatureServer layer index and field mapping per role (see docs/PLAN.md, "Official data findings").
const SENAPRED_LAYERS: Record<LayerRole, LayerImport> = {
  'meeting-point': {
    index: 0,
    clipToBounds: false,
    properties: (raw) => ({ code: text(raw.name), name: optionalText(raw.nombre_pe) }),
  },
  'evacuation-route': {
    index: 1,
    clipToBounds: false,
    properties: (raw) => ({ code: text(raw.name) }),
  },
  'safe-line': {
    index: 2,
    clipToBounds: true,
    properties: (raw) => ({ basis: optionalText(raw.fuente) }),
  },
  'evacuation-area': {
    index: 3,
    clipToBounds: true,
    properties: (raw) => ({ sector: text(raw.sector) }),
  },
};

interface RawFeature {
  type: 'Feature';
  id?: string | number;
  geometry: { type: string; coordinates: unknown } | null;
  properties: RawProperties | null;
}

function parseArgs(argv: string[]): { communeId: string; date: string } {
  const communeId = argv.find((arg) => !arg.startsWith('--')) ?? 'coronel';
  const dateArg = argv.find((arg) => arg.startsWith('--date='))?.slice('--date='.length);
  const date = dateArg ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`invalid --date "${date}"`);
  return { communeId, date };
}

function roundCoordinates(value: unknown): unknown {
  if (typeof value === 'number') return Number(value.toFixed(COORDINATE_DECIMALS));
  if (Array.isArray(value)) return value.map(roundCoordinates);
  return value;
}

type Ring = number[][];

/**
 * Drops what clipping reduced below a valid geometry: lines with fewer than 2 points, rings with
 * fewer than 4, and polygons left without a shell. Returns null when nothing is left.
 */
function cleanClipped(geometry: { type: string; coordinates: unknown }) {
  const isRing = (ring: Ring) => ring.length >= 4;
  if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
    const lines = (
      geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates
    ) as Ring[];
    const kept = lines.filter((line) => line.length >= 2);
    if (kept.length === 0) return null;
    return kept.length === 1
      ? { type: 'LineString', coordinates: kept[0] }
      : { type: 'MultiLineString', coordinates: kept };
  }
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as Ring[];
    return rings[0] && isRing(rings[0])
      ? { type: 'Polygon', coordinates: rings.filter(isRing) }
      : null;
  }
  if (geometry.type === 'MultiPolygon') {
    const polygons = (geometry.coordinates as Ring[][])
      .filter((rings) => rings[0] !== undefined && isRing(rings[0]))
      .map((rings) => rings.filter(isRing));
    if (polygons.length === 0) return null;
    return polygons.length === 1
      ? { type: 'Polygon', coordinates: polygons[0] }
      : { type: 'MultiPolygon', coordinates: polygons };
  }
  return geometry;
}

async function fetchLayer(source: Source, index: number, bounds: Bounds): Promise<RawFeature[]> {
  const [xmin, ymin, xmax, ymax] = bounds;
  const params = new URLSearchParams({
    where: '1=1',
    geometry: JSON.stringify({ xmin, ymin, xmax, ymax, spatialReference: { wkid: 4326 } }),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    outSR: '4326',
    f: 'geojson',
  });
  const url = `${source.url}/${String(index)}/query?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${String(response.status)} for layer ${String(index)}`);
  const body = (await response.json()) as {
    features?: RawFeature[];
    exceededTransferLimit?: boolean;
    error?: unknown;
  };
  if (body.error)
    throw new Error(`service error for layer ${String(index)}: ${JSON.stringify(body.error)}`);
  if (body.exceededTransferLimit)
    throw new Error(`layer ${String(index)} exceeded the transfer limit`);
  return body.features ?? [];
}

function toGeoJsonText(features: unknown[]): string {
  // One feature per line: small diffs when the source changes.
  return `{"type":"FeatureCollection","features":[\n${features.map((f) => JSON.stringify(f)).join(',\n')}\n]}\n`;
}

async function main(): Promise<void> {
  const { communeId, date } = parseArgs(process.argv.slice(2));
  const communeDir = path.join('public', 'data', 'communes', communeId);
  const manifestPath = path.join(communeDir, 'manifest.json');
  const manifestJson: unknown = JSON.parse(await readFile(manifestPath, 'utf8'));
  const parsed = manifestSchema.safeParse(manifestJson);
  if (!parsed.success)
    throw new Error(`invalid manifest:\n${formatIssues(parsed.error).join('\n')}`);
  const manifest = parsed.data;

  const sourceIndex = manifest.sources.findIndex((s) => s.id === SOURCE_ID);
  const baseSource = manifest.sources[sourceIndex];
  if (!baseSource) throw new Error(`manifest has no source "${SOURCE_ID}"`);
  const source: Source = { ...baseSource, retrievedAt: date };

  for (const entry of manifest.layers.filter((layer) => layer.sourceId === SOURCE_ID)) {
    const config = SENAPRED_LAYERS[entry.role];
    const raw = await fetchLayer(source, config.index, manifest.bounds);
    const features = raw.flatMap((feature) => {
      if (!feature.geometry) return [];
      const clipped = config.clipToBounds
        ? cleanClipped(
            bboxClip(feature as Parameters<typeof bboxClip>[0], manifest.bounds).geometry,
          )
        : feature.geometry;
      if (!clipped) return [];
      return [
        {
          type: 'Feature',
          ...(feature.id === undefined ? {} : { id: feature.id }),
          geometry: { type: clipped.type, coordinates: roundCoordinates(clipped.coordinates) },
          properties: {
            ...config.properties(feature.properties ?? {}),
            source: source.name,
            sourceUrl: `${source.url}/${String(config.index)}`,
            retrievedAt: date,
            license: source.license,
            verified: source.verified,
          },
        },
      ];
    });

    const collection = layerSchemas[entry.role].safeParse({ type: 'FeatureCollection', features });
    if (!collection.success) {
      throw new Error(
        `${entry.id} failed validation:\n${formatIssues(collection.error).join('\n')}`,
      );
    }
    const problems = checkLayerConsistency(entry, source, collection.data);
    if (problems.length > 0)
      throw new Error(`${entry.id} is inconsistent:\n${problems.join('\n')}`);

    const target = path.join(communeDir, entry.file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, toGeoJsonText(features));
    console.log(`${entry.id}: ${String(features.length)} features → ${target}`);
  }

  const updated = {
    ...manifest,
    sources: manifest.sources.map((s, i) => (i === sourceIndex ? source : s)),
  };
  await writeFile(manifestPath, `${JSON.stringify(updated, null, 2)}\n`);
  console.log(`manifest: ${SOURCE_ID} retrievedAt = ${date}`);
}

await main();
