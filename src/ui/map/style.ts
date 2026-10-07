// MapLibre style built from validated commune data. Pure: no DOM, no network.
// Basemap: Protomaps v4 vector tile schema (OpenStreetMap data). Overlays: official layers.
import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { LoadedLayer } from '../../data/loader.ts';
import type { Basemap, Bounds, Terrain } from '../../data/schema.ts';

export interface MapPalette {
  water: string;
  land: string;
  park: string;
  building: string;
  /** Relief shading in the 3D view (slopes facing away from / towards the light). */
  hillShadow: string;
  hillHighlight: string;
  /** Sky and horizon seen when the 3D view tilts the map (instead of a blank edge). */
  sky: string;
  horizon: string;
  road: string;
  roadCasing: string;
  label: string;
  labelHalo: string;
  evacuationArea: string;
  safeLine: string;
  route: string;
  meetingPoint: string;
  meetingPointStroke: string;
  userRoute: string;
  userRouteCasing: string;
}

export const LIGHT_PALETTE: MapPalette = {
  water: '#a9cbe8',
  land: '#f4f1ea',
  park: '#d3e6c7',
  building: '#dcd7cc',
  hillShadow: '#7a6648',
  hillHighlight: '#fffaf0',
  sky: '#8ec1f0',
  horizon: '#e6eef7',
  road: '#ffffff',
  roadCasing: '#8a8478',
  label: '#1f1f1f',
  labelHalo: '#ffffff',
  evacuationArea: '#c8102e',
  safeLine: '#6a1b9a',
  route: '#0b6e3a',
  meetingPoint: '#0b6e3a',
  meetingPointStroke: '#ffffff',
  userRoute: '#0a5bd8',
  userRouteCasing: '#ffffff',
};

// Pure black land: on OLED screens black pixels are off, so the dark theme saves battery.
export const DARK_PALETTE: MapPalette = {
  water: '#0b1a2a',
  land: '#000000',
  park: '#0c1d10',
  building: '#1a1c20',
  hillShadow: '#000000',
  hillHighlight: '#4a5263',
  sky: '#050c1f',
  horizon: '#1b2740',
  road: '#3b4049',
  roadCasing: '#000000',
  label: '#e8eef5',
  labelHalo: '#000000',
  evacuationArea: '#ff6b7f',
  safeLine: '#d59cff',
  route: '#5fe39a',
  meetingPoint: '#1f9d57',
  meetingPointStroke: '#ffffff',
  userRoute: '#64a8ff',
  userRouteCasing: '#000000',
};

/** Image id of the diagonal hatch used so the evacuation area is not shown by color alone. */
export const HATCH_IMAGE_ID = 'evacua-hatch';
/** Meeting point marker (green disc with a walking person), drawn at runtime by MapView. */
export const MEETING_POINT_ICON_ID = 'evacua-meeting-point';
/** Arrow on the user's position while navigating, rotated by the feature's `bearing`. */
export const NAV_ARROW_ICON_ID = 'evacua-nav-arrow';
/** White chevrons repeated along the user's route, pointing the way. */
export const ROUTE_CHEVRON_ICON_ID = 'evacua-route-chevron';
/** Stretchable green pill behind the destination's label (its meeting point code). */
export const LABEL_PILL_ICON_ID = 'evacua-label-pill';

const BASEMAP_SOURCE = 'basemap';
/** Offline elevation (3D relief) and its shading, both only used by the 3D view. */
export const TERRAIN_SOURCE = 'terrain';
export const HILLSHADE_LAYER_ID = 'hillshade';
const LABEL_FONT = ['Noto Sans Regular'];
const PLACE_FONT = LABEL_FONT;
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
          id: `${id}-icon`,
          type: 'symbol',
          source,
          layout: {
            'icon-image': MEETING_POINT_ICON_ID,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
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
            'text-offset': [0, 1.6],
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

/** Sources the app updates at runtime with the user's position and route (not official data). */
export const USER_ROUTE_SOURCE = 'user-route';
export const USER_POSITION_SOURCE = 'user-position';
export const DESTINATION_SOURCE = 'destination';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

function userLayers(p: MapPalette, youLabel: string): LayerSpecification[] {
  return [
    {
      id: 'user-route-casing',
      type: 'line',
      source: USER_ROUTE_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': p.userRouteCasing, 'line-width': 11 },
    },
    {
      id: 'user-route',
      type: 'line',
      source: USER_ROUTE_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': p.userRoute, 'line-width': 7 },
    },
    {
      // Chevrons along the line show which way to walk, not only where the line goes.
      id: 'user-route-chevrons',
      type: 'symbol',
      source: USER_ROUTE_SOURCE,
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 34,
        'icon-image': ROUTE_CHEVRON_ICON_ID,
        'icon-rotation-alignment': 'map',
        'icon-padding': 0,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    },
    {
      id: 'destination-ring',
      type: 'circle',
      source: DESTINATION_SOURCE,
      paint: {
        'circle-radius': 16,
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': p.userRoute,
        'circle-stroke-width': 5,
      },
    },
    {
      // The destination's name (its meeting point code) in a green pill under the ring.
      id: 'destination-label',
      type: 'symbol',
      source: DESTINATION_SOURCE,
      layout: {
        'text-field': ['get', 'label'],
        'text-font': PLACE_FONT,
        'text-size': 14,
        'text-offset': [0, 1.9],
        'text-anchor': 'top',
        'text-allow-overlap': true,
        'icon-image': LABEL_PILL_ICON_ID,
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [3, 8, 3, 8],
        'icon-allow-overlap': true,
      },
      paint: { 'text-color': '#ffffff' },
    },
    {
      id: 'user-position',
      type: 'circle',
      source: USER_POSITION_SOURCE,
      paint: {
        'circle-radius': 10,
        'circle-color': p.userRoute,
        'circle-stroke-color': p.userRouteCasing,
        'circle-stroke-width': 4,
      },
    },
    {
      // Only while navigating: the position carries the direction to walk.
      id: 'user-heading',
      type: 'symbol',
      source: USER_POSITION_SOURCE,
      filter: ['has', 'bearing'],
      layout: {
        'icon-image': NAV_ARROW_ICON_ID,
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    },
    {
      id: 'user-position-label',
      type: 'symbol',
      source: USER_POSITION_SOURCE,
      layout: {
        'text-field': youLabel,
        'text-font': PLACE_FONT,
        'text-size': 15,
        'text-offset': [0, -1.6],
        'text-anchor': 'bottom',
        'text-allow-overlap': true,
      },
      paint: { 'text-color': p.label, 'text-halo-color': p.labelHalo, 'text-halo-width': 2 },
    },
  ];
}

export interface StyleInput {
  basemap: Basemap;
  layers: readonly LoadedLayer[];
  palette: MapPalette;
  /** Absolute origin used to build same-origin tile and glyph URLs. */
  origin: string;
  /** Label of the user's position marker, already translated. */
  youLabel: string;
  /**
   * Area the offline tiles cover (the manifest's data bounds). MapLibre never asks for tiles
   * outside it, e.g. towards the horizon of the tilted 3D view, where none were extracted.
   */
  tileBounds?: Bounds;
  /** Offline elevation tiles; without them the 3D view stays on flat ground. */
  terrain?: Terrain | undefined;
}

export function buildStyle({
  basemap,
  layers,
  palette,
  origin,
  youLabel,
  tileBounds,
  terrain,
}: StyleInput): StyleSpecification {
  const overlaySources = Object.fromEntries(
    layers.map((layer) => [
      overlaySourceId(layer.entry.id),
      {
        type: 'geojson' as const,
        data: layer.collection, // validated by zod (src/data/schema.ts)
        attribution: layer.source.attribution,
      },
    ]),
  );
  const bounds = tileBounds ? { bounds: [...tileBounds] as [number, number, number, number] } : {};
  const base = basemapLayers(palette);
  if (terrain) {
    // Shading right above water: under roads, buildings, labels and the official layers.
    const afterWater = base.findIndex((l) => l.id === 'water') + 1;
    base.splice(afterWater, 0, {
      id: HILLSHADE_LAYER_ID,
      type: 'hillshade',
      source: TERRAIN_SOURCE,
      layout: { visibility: 'none' },
      paint: {
        // Earth tones only: a bluish shadow could be mistaken for water.
        'hillshade-shadow-color': palette.hillShadow,
        'hillshade-accent-color': palette.hillShadow,
        'hillshade-highlight-color': palette.hillHighlight,
        'hillshade-exaggeration': 0.5,
      },
    });
  }
  return {
    version: 8,
    glyphs: `${origin}/fonts/{fontstack}/{range}.pbf`,
    // Only visible when the 3D view tilts the camera far enough to see the horizon.
    sky: {
      'sky-color': palette.sky,
      'horizon-color': palette.horizon,
      'fog-color': palette.land,
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.85,
      'atmosphere-blend': 0,
    },
    sources: {
      [BASEMAP_SOURCE]: {
        type: 'vector',
        tiles: [`${origin}${basemap.tiles}`],
        minzoom: basemap.minzoom,
        maxzoom: basemap.maxzoom,
        attribution: basemap.attribution,
        ...bounds,
      },
      ...(terrain
        ? {
            [TERRAIN_SOURCE]: {
              type: 'raster-dem' as const,
              tiles: [`${origin}${terrain.tiles}`],
              encoding: terrain.encoding,
              tileSize: terrain.tileSize,
              minzoom: terrain.minzoom,
              maxzoom: terrain.maxzoom,
              attribution: terrain.attribution,
              ...bounds,
            },
          }
        : {}),
      ...overlaySources,
      [USER_ROUTE_SOURCE]: { type: 'geojson', data: EMPTY },
      [DESTINATION_SOURCE]: { type: 'geojson', data: EMPTY },
      [USER_POSITION_SOURCE]: { type: 'geojson', data: EMPTY },
    },
    layers: [
      ...base,
      ...layers.flatMap((layer) => overlayLayers(layer, palette)),
      ...userLayers(palette, youLabel),
    ],
  };
}
