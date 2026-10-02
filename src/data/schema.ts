// Runtime validation for every data file the app loads. Nothing reaches the UI unvalidated.
import { z } from 'zod';
import { HAZARD_IDS } from '../domain/hazards.ts';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase slug');
const httpsUrl = z.url().refine((value) => value.startsWith('https://'), 'must use https');
const isoDate = z.iso.date();
const longitude = z.number().min(-180).max(180);
const latitude = z.number().min(-90).max(90);

/** [west, south, east, north] in WGS84 degrees. */
export const boundsSchema = z
  .tuple([longitude, latitude, longitude, latitude])
  .refine(([west, south, east, north]) => west < east && south < north, {
    message: 'bounds must be [west, south, east, north]',
  });
export type Bounds = z.infer<typeof boundsSchema>;

// ---------------------------------------------------------------------------------------------
// GeoJSON geometries (only the types the app uses)

const position = z.tuple([longitude, latitude], z.number());
const lineCoordinates = z.array(position).min(2);
const linearRing = z
  .array(position)
  .min(4)
  .refine((ring) => {
    const [firstLon, firstLat] = ring[0] ?? [];
    const [lastLon, lastLat] = ring[ring.length - 1] ?? [];
    return firstLon !== undefined && firstLon === lastLon && firstLat === lastLat;
  }, 'polygon rings must be closed');
const polygonCoordinates = z.array(linearRing).min(1);

const pointGeometry = z.object({ type: z.literal('Point'), coordinates: position });
const lineGeometry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('LineString'), coordinates: lineCoordinates }),
  z.object({ type: z.literal('MultiLineString'), coordinates: z.array(lineCoordinates).min(1) }),
]);
const areaGeometry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: polygonCoordinates }),
  z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(polygonCoordinates).min(1) }),
]);

// ---------------------------------------------------------------------------------------------
// Per-feature provenance: mandatory on every geographic feature (CLAUDE.md, safety-data rule).

export const featureMetaSchema = z.object({
  source: z.string().min(1),
  sourceUrl: httpsUrl,
  retrievedAt: isoDate,
  license: z.string().min(1),
  verified: z.boolean(),
});
export type FeatureMeta = z.infer<typeof featureMetaSchema>;

export const LAYER_ROLES = [
  'evacuation-area',
  'safe-line',
  'evacuation-route',
  'meeting-point',
] as const;
export type LayerRole = (typeof LAYER_ROLES)[number];

function featureCollection<G extends z.ZodType, P extends z.ZodType>(geometry: G, properties: P) {
  const feature = z.object({
    type: z.literal('Feature'),
    id: z.union([z.string(), z.number()]).optional(),
    geometry,
    properties,
  });
  return z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(feature).min(1, 'a layer must contain at least one feature'),
  });
}

export const layerSchemas = {
  'evacuation-area': featureCollection(
    areaGeometry,
    featureMetaSchema.extend({ sector: z.string().min(1) }),
  ),
  'safe-line': featureCollection(
    lineGeometry,
    featureMetaSchema.extend({ basis: z.string().min(1).nullable() }),
  ),
  'evacuation-route': featureCollection(
    lineGeometry,
    featureMetaSchema.extend({ code: z.string().min(1) }),
  ),
  'meeting-point': featureCollection(
    pointGeometry,
    featureMetaSchema.extend({ code: z.string().min(1), name: z.string().min(1).nullable() }),
  ),
} satisfies Record<LayerRole, z.ZodType>;

export type LayerCollection<R extends LayerRole = LayerRole> = z.infer<(typeof layerSchemas)[R]>;

// ---------------------------------------------------------------------------------------------
// Commune manifest and registry

export const sourceSchema = z.object({
  id: slug,
  name: z.string().min(1),
  publisher: z.string().min(1),
  /** Short credit shown on the map, e.g. "SENAPRED". */
  attribution: z.string().min(1).max(40),
  url: httpsUrl,
  catalogUrl: httpsUrl.optional(),
  license: z.string().min(1),
  retrievedAt: isoDate,
  verified: z.boolean(),
  notes: z.string().optional(),
});
export type Source = z.infer<typeof sourceSchema>;

export const layerEntrySchema = z.object({
  id: slug,
  role: z.enum(LAYER_ROLES),
  hazards: z.array(z.enum(HAZARD_IDS)).min(1),
  // Relative path inside the commune folder; no "..", no scheme, no leading slash.
  file: z
    .string()
    .regex(/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.geojson$/, 'must be a relative .geojson path'),
  sourceId: slug,
});
export type LayerEntry = z.infer<typeof layerEntrySchema>;

/** Offline basemap tiles extracted for the commune (see scripts/build-tiles.ts). */
export const basemapSchema = z.object({
  // Same-origin static tiles only.
  tiles: z
    .string()
    .regex(
      /^\/tiles\/[a-z0-9-]+\/\{z\}\/\{x\}\/\{y\}\.mvt$/,
      'must be /tiles/<id>/{z}/{x}/{y}.mvt',
    ),
  minzoom: z.number().int().min(0).max(22),
  maxzoom: z.number().int().min(0).max(22),
  attribution: z.string().min(1),
  source: z.string().min(1),
  license: z.string().min(1),
  retrievedAt: isoDate,
});
export type Basemap = z.infer<typeof basemapSchema>;

/** Pedestrian network extracted from OpenStreetMap (see scripts/build-graph.ts). */
export const graphEntrySchema = z.object({
  file: z.string().regex(/^[a-z0-9-]+\.json$/, 'must be a relative .json file name'),
  source: z.string().min(1),
  sourceUrl: httpsUrl,
  license: z.string().min(1),
  retrievedAt: isoDate,
});
export type GraphEntry = z.infer<typeof graphEntrySchema>;

/**
 * Compact graph: `nodes` is [lon0, lat0, lon1, lat1, …]; `edges` is [from, to, meters, …]
 * with node indices. Edges are walkable in both directions.
 */
export const graphFileSchema = z
  .object({
    schemaVersion: z.literal(1),
    nodes: z.array(z.number()).min(2),
    edges: z.array(z.number()),
  })
  .superRefine((graph, ctx) => {
    if (graph.nodes.length % 2 !== 0) {
      ctx.addIssue({ code: 'custom', path: ['nodes'], message: 'nodes must be [lon, lat] pairs' });
      return;
    }
    if (graph.edges.length % 3 !== 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['edges'],
        message: 'edges must be [from, to, meters] triples',
      });
      return;
    }
    for (let i = 0; i < graph.nodes.length; i += 2) {
      const lon = graph.nodes[i] ?? NaN;
      const lat = graph.nodes[i + 1] ?? NaN;
      if (!(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90)) {
        ctx.addIssue({ code: 'custom', path: ['nodes', i], message: 'coordinate out of range' });
        return;
      }
    }
    const nodeCount = graph.nodes.length / 2;
    for (let i = 0; i < graph.edges.length; i += 3) {
      const from = graph.edges[i] ?? -1;
      const to = graph.edges[i + 1] ?? -1;
      const meters = graph.edges[i + 2] ?? -1;
      const validIndex = (n: number) => Number.isInteger(n) && n >= 0 && n < nodeCount;
      if (!validIndex(from) || !validIndex(to) || !(meters >= 0)) {
        ctx.addIssue({ code: 'custom', path: ['edges', i], message: 'invalid edge' });
        return;
      }
    }
  });
export type GraphFile = z.infer<typeof graphFileSchema>;

/** Preset positions for "Simular ubicación (DEMO)"; always shown with a DEMO label. */
export const demoLocationSchema = z.object({
  id: slug,
  label: z.object({ 'es-CL': z.string().min(1), en: z.string().min(1) }),
  coordinates: z.tuple([longitude, latitude]),
});
export type DemoLocation = z.infer<typeof demoLocationSchema>;

function contains(outer: Bounds, inner: Bounds): boolean {
  return (
    outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3]
  );
}

export const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: slug,
    name: z.string().min(1),
    region: z.string().min(1),
    country: z.string().regex(/^[A-Z]{2}$/),
    sector: z.object({
      id: slug,
      name: z.string().min(1),
      serviceArea: boundsSchema,
      note: z.string().min(1),
    }),
    bounds: boundsSchema,
    basemap: basemapSchema,
    // Optional: without a graph the app falls back to a labeled straight line.
    graph: graphEntrySchema.optional(),
    demoLocations: z.array(demoLocationSchema).default([]),
    layers: z.array(layerEntrySchema).min(1),
    sources: z.array(sourceSchema).min(1),
  })
  .superRefine((manifest, ctx) => {
    const sourceIds = new Set(manifest.sources.map((source) => source.id));
    const layerIds = new Set<string>();
    manifest.layers.forEach((layer, index) => {
      if (!sourceIds.has(layer.sourceId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['layers', index, 'sourceId'],
          message: `unknown source "${layer.sourceId}"`,
        });
      }
      if (layerIds.has(layer.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['layers', index, 'id'],
          message: `duplicate layer id "${layer.id}"`,
        });
      }
      layerIds.add(layer.id);
    });
    if (manifest.basemap.minzoom > manifest.basemap.maxzoom) {
      ctx.addIssue({ code: 'custom', path: ['basemap', 'minzoom'], message: 'minzoom > maxzoom' });
    }
    if (!contains(manifest.bounds, manifest.sector.serviceArea)) {
      ctx.addIssue({
        code: 'custom',
        path: ['sector', 'serviceArea'],
        message: 'the service area must lie inside the data bounds',
      });
    }
  });
export type Manifest = z.infer<typeof manifestSchema>;

export const registrySchema = z
  .object({
    schemaVersion: z.literal(1),
    defaultCommune: slug,
    communes: z
      .array(
        z.object({
          id: slug,
          manifest: z
            .string()
            .regex(/^[a-z0-9-]+\/manifest\.json$/, 'must be "<id>/manifest.json"'),
        }),
      )
      .min(1),
  })
  .refine((registry) => registry.communes.some((c) => c.id === registry.defaultCommune), {
    message: 'defaultCommune must be listed in communes',
    path: ['defaultCommune'],
  });
export type Registry = z.infer<typeof registrySchema>;

/** Flattens zod issues into short "path: message" strings for logs and error screens. */
export function formatIssues(error: z.ZodError, limit = 10): string[] {
  return error.issues.slice(0, limit).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}
