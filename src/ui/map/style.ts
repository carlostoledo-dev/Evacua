// MapLibre style built from validated commune data. Pure: no DOM, no network.
// Basemap: Protomaps v4 vector tile schema (OpenStreetMap data). Overlays: official layers.
import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { LoadedLayer } from '../../data/loader.ts';
import type { Basemap } from '../../data/schema.ts';

export interface MapPalette {
  water: string;
  land: string;
  park: string;
  building: string;
  road: string;
  roadCasing: string;
  label: string;
  labelHalo: string;
  evacuationArea: string;
  safeLine: string;
  route: string;
  meetingPoint: string;
  meetingPointStroke: string;
}

export const LIGHT_PALETTE: MapPalette = {
  water: '#a9cbe8',
  land: '#f4f1ea',
  park: '#d3e6c7',
  building: '#dcd7cc',
  road: '#ffffff',
  roadCasing: '#8a8478',
  label: '#1f1f1f',
  labelHalo: '#ffffff',
  evacuationArea: '#c8102e',
  safeLine: '#6a1b9a',
  route: '#0b6e3a',
  meetingPoint: '#0b6e3a',
  meetingPointStroke: '#ffffff',
};

export const DARK_PALETTE: MapPalette = {
  water: '#1c3550',
  land: '#1a1d22',
  park: '#22311f',
  building: '#2c2f35',
  road: '#4a4f58',
  roadCasing: '#0d0f12',
  label: '#eef2f7',
  labelHalo: '#0b1220',
  evacuationArea: '#ff6b7f',
  safeLine: '#d59cff',
  route: '#5fe39a',
  meetingPoint: '#5fe39a',
  meetingPointStroke: '#0b1220',
};

/** Image id of the diagonal hatch used so the evacuation area is not shown by color alone. */
export const HATCH_IMAGE_ID = 'evacua-hatch';

const BASEMAP_SOURCE = 'basemap';
const LABEL_FONT = ['Noto Sans Regular'];
const PLACE_FONT = ['Noto Sans Medium'];
const NAME: ExpressionSpecification = ['coalesce', ['get', 'name:es'], ['get', 'name']];

/** MapLibre source id for an official data layer. */
export function overlaySourceId(layerId: string): string {
  return `overlay-${layerId}`;
}

function basemapLayers(p: MapPalette): LayerSpecification[] {
  const src = { source: BASEMAP_SOURCE } as const;
  const roadWidth = (base: number): ExpressionSpecification => [
    'interpolate',
    ['exponential', 1.6],
    ['zoom'],
    12,
    base * 0.5,
    18,
    base * 4,
  ];
  return [
    { id: 'water-background', type: 'background', paint: { 'background-color': p.water } },
    { id: 'earth', type: 'fill', ...src, 'source-layer': 'earth', paint: { 'fill-color': p.land } },
    {
      id: 'parks',
      type: 'fill',
      ...src,
      'source-layer': 'landuse',
      filter: [
        'in',
        ['get', 'kind'],
        ['literal', ['park', 'forest', 'wood', 'grass', 'nature_reserve']],
      ],
      paint: { 'fill-color': p.park },
    },
    {
      id: 'water',
      type: 'fill',
      ...src,
      'source-layer': 'water',
      paint: { 'fill-color': p.water },
    },
    {
      id: 'buildings',
      type: 'fill',
      ...src,
      'source-layer': 'buildings',
      minzoom: 14,
      paint: { 'fill-color': p.building },
    },
    {
      id: 'roads-casing',
      type: 'line',
      ...src,
      'source-layer': 'roads',
      filter: ['in', ['get', 'kind'], ['literal', ['highway', 'major_road', 'minor_road']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': p.roadCasing, 'line-width': roadWidth(1.8) },
    },
    {
      id: 'roads',
      type: 'line',
      ...src,
      'source-layer': 'roads',
      filter: ['in', ['get', 'kind'], ['literal', ['highway', 'major_road', 'minor_road']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': p.road, 'line-width': roadWidth(1.3) },
    },
    {
      id: 'paths',
      type: 'line',
      ...src,
      'source-layer': 'roads',
      filter: ['==', ['get', 'kind'], 'path'],
      paint: { 'line-color': p.roadCasing, 'line-width': 1, 'line-dasharray': [2, 2] },
    },
    {
      id: 'road-labels',
      type: 'symbol',
      ...src,
      'source-layer': 'roads',
      minzoom: 14,
      layout: {
        'symbol-placement': 'line',
        'text-field': NAME,
        'text-font': LABEL_FONT,
        'text-size': 13,
      },
      paint: { 'text-color': p.label, 'text-halo-color': p.labelHalo, 'text-halo-width': 2 },
    },
    {
      id: 'place-labels',
      type: 'symbol',
      ...src,
      'source-layer': 'places',
      filter: ['in', ['get', 'kind'], ['literal', ['neighbourhood', 'suburb', 'locality']]],
      layout: { 'text-field': NAME, 'text-font': PLACE_FONT, 'text-size': 14 },
      paint: { 'text-color': p.label, 'text-halo-color': p.labelHalo, 'text-halo-width': 2 },
    },
  ];
}

function overlayLayers(layer: LoadedLayer, p: MapPalette): LayerSpecification[] {
  const source = overlaySourceId(layer.entry.id);
  const id = layer.entry.id;
  switch (layer.entry.role) {
    case 'evacuation-area':
      return [
        {
          id: `${id}-fill`,
          type: 'fill',
          source,
          paint: { 'fill-color': p.evacuationArea, 'fill-opacity': 0.16 },
        },
        {
          id: `${id}-hatch`,
          type: 'fill',
          source,
          paint: { 'fill-pattern': HATCH_IMAGE_ID, 'fill-opacity': 0.5 },
        },
      ];
    case 'safe-line':
      return [
        {
          id,
          type: 'line',
          source,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': p.safeLine, 'line-width': 4 },
        },
      ];
    case 'evacuation-route':
      return [
        {
          id,
          type: 'line',
          source,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': p.route, 'line-width': 4, 'line-dasharray': [1.5, 1] },
        },
      ];
    case 'meeting-point':
      return [
        {
          id: `${id}-circle`,
          type: 'circle',
          source,
          paint: {
            'circle-radius': 9,
            'circle-color': p.meetingPoint,
            'circle-stroke-color': p.meetingPointStroke,
            'circle-stroke-width': 3,
          },
        },
        {
          id: `${id}-label`,
          type: 'symbol',
          source,
          layout: {
            // "08102PE029" → "PE029"
            'text-field': ['slice', ['get', 'code'], 5],
            'text-font': PLACE_FONT,
            'text-size': 14,
            'text-offset': [0, 1.4],
            'text-anchor': 'top',
          },
          paint: { 'text-color': p.label, 'text-halo-color': p.labelHalo, 'text-halo-width': 2 },
        },
      ];
  }
}

/** Map layer ids drawn for one official data layer (used to toggle visibility per hazard). */
export function overlayLayerIds(layer: LoadedLayer): string[] {
  return overlayLayers(layer, LIGHT_PALETTE).map((l) => l.id);
}

export interface StyleInput {
  basemap: Basemap;
  layers: readonly LoadedLayer[];
  palette: MapPalette;
  /** Absolute origin used to build same-origin tile and glyph URLs. */
  origin: string;
}

export function buildStyle({ basemap, layers, palette, origin }: StyleInput): StyleSpecification {
  const overlaySources = Object.fromEntries(
    layers.map((layer) => [
      overlaySourceId(layer.entry.id),
      {
        type: 'geojson' as const,
        data: layer.collection, // validated by zod (src/data/schema.ts)
        attribution: layer.source.publisher,
      },
    ]),
  );
  return {
    version: 8,
    glyphs: `${origin}/fonts/{fontstack}/{range}.pbf`,
    sources: {
      [BASEMAP_SOURCE]: {
        type: 'vector',
        tiles: [`${origin}${basemap.tiles}`],
        minzoom: basemap.minzoom,
        maxzoom: basemap.maxzoom,
        attribution: basemap.attribution,
      },
      ...overlaySources,
    },
    layers: [
      ...basemapLayers(palette),
      ...layers.flatMap((layer) => overlayLayers(layer, palette)),
    ],
  };
}
