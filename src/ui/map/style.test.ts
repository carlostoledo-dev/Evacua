import { describe, expect, it } from 'vitest';
import type { LoadedLayer } from '../../data/loader.ts';
import { manifestSchema, layerSchemas } from '../../data/schema.ts';
import { manifest, meetingPoints, source } from '../../data/__fixtures__/commune.ts';
import { diagonalHatch, hexToRgb } from './hatch.ts';
import { APPROX_BUILDING_HEIGHT_M } from '../../domain/constants.ts';
import {
  buildStyle,
  BUILDINGS_3D_LAYER_ID,
  BUILDINGS_LAYER_ID,
  DARK_PALETTE,
  HATCH_IMAGE_ID,
  LIGHT_PALETTE,
  overlayLayerIds,
  overlaySourceId,
} from './style.ts';

const parsedManifest = manifestSchema.parse(manifest('alpha'));
const entry = parsedManifest.layers[0];
if (!entry) throw new Error('fixture manifest has no layer');
const layer: LoadedLayer = {
  entry,
  source: { ...source(), verified: false },
  collection: layerSchemas['meeting-point'].parse(meetingPoints()),
  status: 'demo',
};

describe('buildStyle', () => {
  const style = buildStyle({
    basemap: parsedManifest.basemap,
    layers: [layer],
    palette: LIGHT_PALETTE,
    origin: 'https://evacua.test',
    youLabel: 'Tú',
    goHereLabel: 'Ve aquí',
  });

  it('only references same-origin tiles and glyphs', () => {
    expect(style.glyphs).toBe('https://evacua.test/fonts/{fontstack}/{range}.pbf');
    expect(style.sources.basemap).toMatchObject({
      type: 'vector',
      tiles: ['https://evacua.test/tiles/alpha/{z}/{x}/{y}.mvt'],
      attribution: '© OpenStreetMap contributors',
    });
  });

  it('keeps 3D buildings hidden until asked, with approximate heights when OSM has none', () => {
    const flat = style.layers.find((l) => l.id === BUILDINGS_LAYER_ID);
    const raised = style.layers.find((l) => l.id === BUILDINGS_3D_LAYER_ID);
    expect(flat?.type).toBe('fill');
    expect(raised).toMatchObject({
      type: 'fill-extrusion',
      layout: { visibility: 'none' },
      paint: {
        'fill-extrusion-height': ['coalesce', ['get', 'height'], APPROX_BUILDING_HEIGHT_M],
      },
    });
  });

  it('never asks for basemap tiles outside the area that was extracted', () => {
    const bounded = buildStyle({
      basemap: parsedManifest.basemap,
      layers: [layer],
      palette: LIGHT_PALETTE,
      origin: 'https://evacua.test',
      youLabel: 'Tú',
      goHereLabel: 'Ve aquí',
      tileBounds: parsedManifest.bounds,
    });
    expect(bounded.sources.basemap).toMatchObject({ bounds: [...parsedManifest.bounds] });
    expect(style.sources.basemap).not.toHaveProperty('bounds');
  });

  it('adds each official layer as a GeoJSON source credited to its publisher', () => {
    expect(style.sources[overlaySourceId(entry.id)]).toMatchObject({
      type: 'geojson',
      attribution: 'Evacua tests',
    });
  });

  it('draws overlays above the basemap', () => {
    const ids = style.layers.map((l) => l.id);
    for (const id of overlayLayerIds(layer)) {
      expect(ids.indexOf(id)).toBeGreaterThan(ids.indexOf('place-labels'));
    }
  });

  it('labels meeting points with their short code', () => {
    const label = style.layers.find((l) => l.id === `${entry.id}-label`);
    expect(label?.type).toBe('symbol');
  });

  it('uses a hatch pattern for evacuation areas, not color alone', () => {
    const areaStyle = buildStyle({
      basemap: parsedManifest.basemap,
      layers: [{ ...layer, entry: { ...entry, role: 'evacuation-area' } }],
      palette: DARK_PALETTE,
      origin: 'https://evacua.test',
      youLabel: 'Tú',
      goHereLabel: 'Ve aquí',
    });
    const hatch = areaStyle.layers.find((l) => l.id.endsWith('-hatch'));
    expect(hatch?.paint).toMatchObject({ 'fill-pattern': HATCH_IMAGE_ID });
  });
});

describe('diagonalHatch', () => {
  it('parses hex colors', () => {
    expect(hexToRgb('#0b6e3a')).toEqual([11, 110, 58]);
    expect(() => hexToRgb('red')).toThrow();
  });

  it('produces an RGBA square with opaque stripes and transparent gaps', () => {
    const { width, height, data } = diagonalHatch('#ff0000', 8, 2);
    expect(width).toBe(8);
    expect(height).toBe(8);
    expect(data).toHaveLength(8 * 8 * 4);
    expect(Array.from(data.slice(0, 4))).toEqual([255, 0, 0, 255]); // (0,0) on a stripe
    expect(data[(0 * 8 + 4) * 4 + 3]).toBe(0); // (4,0) in a gap
  });
});
