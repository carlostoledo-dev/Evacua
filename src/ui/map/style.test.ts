import { describe, expect, it } from 'vitest';
import type { LoadedLayer } from '../../data/loader.ts';
import { manifestSchema, layerSchemas } from '../../data/schema.ts';
import { manifest, meetingPoints, source } from '../../data/__fixtures__/commune.ts';
import { diagonalHatch, hexToRgb } from './hatch.ts';
import {
  buildStyle,
  DARK_PALETTE,
  HATCH_IMAGE_ID,
  HILLSHADE_LAYER_ID,
  LIGHT_PALETTE,
  overlayLayerIds,
  overlaySourceId,
  TERRAIN_SOURCE,
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
  });

  it('only references same-origin tiles and glyphs', () => {
    expect(style.glyphs).toBe('https://evacua.test/fonts/{fontstack}/{range}.pbf');
    expect(style.sources.basemap).toMatchObject({
      type: 'vector',
      tiles: ['https://evacua.test/tiles/alpha/{z}/{x}/{y}.mvt'],
      attribution: '© OpenStreetMap contributors',
    });
  });

  it('draws buildings flat only: no 3D extrusion (the 3D view is about the relief)', () => {
    expect(style.layers.find((l) => l.id === 'buildings')?.type).toBe('fill');
    expect(style.layers.some((l) => l.type === 'fill-extrusion')).toBe(false);
  });

  it('never asks for basemap tiles outside the area that was extracted', () => {
    const bounded = buildStyle({
      basemap: parsedManifest.basemap,
      layers: [layer],
      palette: LIGHT_PALETTE,
      origin: 'https://evacua.test',
      youLabel: 'Tú',
      tileBounds: parsedManifest.bounds,
    });
    expect(bounded.sources.basemap).toMatchObject({ bounds: [...parsedManifest.bounds] });
    expect(style.sources.basemap).not.toHaveProperty('bounds');
  });

  it('adds the offline relief (same origin, bounded, credited) only when the commune has it', () => {
    const terrain = {
      tiles: '/terrain/alpha/{z}/{x}/{y}.png',
      encoding: 'terrarium' as const,
      tileSize: 256,
      minzoom: 10,
      maxzoom: 13,
      attribution: 'Relieve: USGS, NOAA',
      source: 'test',
      license: 'test',
      retrievedAt: '2026-10-06',
    };
    const withRelief = buildStyle({
      basemap: parsedManifest.basemap,
      layers: [layer],
      palette: LIGHT_PALETTE,
      origin: 'https://evacua.test',
      youLabel: 'Tú',
      tileBounds: parsedManifest.bounds,
      terrain,
    });
    expect(withRelief.sources[TERRAIN_SOURCE]).toMatchObject({
      type: 'raster-dem',
      tiles: ['https://evacua.test/terrain/alpha/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      attribution: 'Relieve: USGS, NOAA',
      bounds: [...parsedManifest.bounds],
    });
    // Shading stays hidden until the 3D view, and sits under the official layers.
    const ids = withRelief.layers.map((l) => l.id);
    const shade = withRelief.layers.find((l) => l.id === HILLSHADE_LAYER_ID);
    expect(shade?.layout).toMatchObject({ visibility: 'none' });
    expect(ids.indexOf(HILLSHADE_LAYER_ID)).toBeLessThan(
      ids.indexOf(overlayLayerIds(layer)[0] ?? ''),
    );
    expect(style.sources).not.toHaveProperty(TERRAIN_SOURCE);
    expect(style.layers.map((l) => l.id)).not.toContain(HILLSHADE_LAYER_ID);
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
