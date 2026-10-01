import { describe, expect, it } from 'vitest';
import { manifest, meetingPoints, meta } from './__fixtures__/commune.ts';
import { layerSchemas, manifestSchema, registrySchema } from './schema.ts';

const META_FIELDS = ['source', 'sourceUrl', 'retrievedAt', 'license', 'verified'] as const;

function pointsWithout(field: string) {
  const collection = meetingPoints();
  const feature = collection.features[0];
  if (!feature) throw new Error('fixture has no feature');
  const properties = Object.fromEntries(
    Object.entries(feature.properties).filter(([key]) => key !== field),
  );
  return { ...collection, features: [{ ...feature, properties }] };
}

describe('layer feature metadata', () => {
  it('accepts a feature with full provenance', () => {
    expect(layerSchemas['meeting-point'].safeParse(meetingPoints()).success).toBe(true);
  });

  it.each(META_FIELDS)('rejects a feature without "%s"', (field) => {
    const result = layerSchemas['meeting-point'].safeParse(pointsWithout(field));
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(field);
  });

  it('rejects a non-https source URL', () => {
    const data = meetingPoints({ sourceUrl: 'http://example.org/data/points' });
    expect(layerSchemas['meeting-point'].safeParse(data).success).toBe(false);
  });

  it('rejects a retrievedAt that is not an ISO date', () => {
    const data = meetingPoints({ retrievedAt: 'yesterday' });
    expect(layerSchemas['meeting-point'].safeParse(data).success).toBe(false);
  });

  it('rejects an empty layer', () => {
    const data = { type: 'FeatureCollection', features: [] };
    expect(layerSchemas['meeting-point'].safeParse(data).success).toBe(false);
  });
});

describe('layer geometry', () => {
  it('rejects a geometry type that does not match the role', () => {
    const data = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-73.1, -37],
              [-73.2, -37],
            ],
          },
          properties: { code: 'PE001', name: null, ...meta() },
        },
      ],
    };
    expect(layerSchemas['meeting-point'].safeParse(data).success).toBe(false);
  });

  it('rejects coordinates outside WGS84 ranges', () => {
    const data = meetingPoints();
    const feature = data.features[0];
    if (!feature) throw new Error('fixture has no feature');
    feature.geometry.coordinates = [-273.1, -37];
    expect(layerSchemas['meeting-point'].safeParse(data).success).toBe(false);
  });

  it('rejects polygons with open rings', () => {
    const openRing = [
      [-73.1, -37],
      [-73.2, -37],
      [-73.2, -37.1],
      [-73.1, -37.1],
    ];
    const data = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [openRing] },
          properties: { sector: 'Test', ...meta() },
        },
      ],
    };
    expect(layerSchemas['evacuation-area'].safeParse(data).success).toBe(false);
  });
});

describe('manifest', () => {
  it('accepts a valid manifest', () => {
    expect(manifestSchema.safeParse(manifest('test')).success).toBe(true);
  });

  it('rejects inverted bounds', () => {
    expect(
      manifestSchema.safeParse(manifest('test', { bounds: [-73.1, -37, -73.2, -36.9] })).success,
    ).toBe(false);
  });

  it('rejects a service area outside the data bounds', () => {
    const data = manifest('test', {
      sector: { id: 'pilot', name: 'Pilot', serviceArea: [-74, -38, -73.9, -37.9], note: 'x' },
    });
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects a layer pointing to an unknown source', () => {
    const base = manifest('test');
    const data = { ...base, layers: base.layers.map((l) => ({ ...l, sourceId: 'nope' })) };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects duplicate layer ids', () => {
    const base = manifest('test');
    const data = { ...base, layers: [...base.layers, ...base.layers] };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it.each([
    '../secret.geojson',
    '/etc/x.geojson',
    'https://evil.example/x.geojson',
    'layers/x.json',
  ])('rejects the unsafe layer path "%s"', (file) => {
    const base = manifest('test');
    const data = { ...base, layers: base.layers.map((l) => ({ ...l, file })) };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });
});

describe('registry', () => {
  it('requires the default commune to be listed', () => {
    const data = {
      schemaVersion: 1,
      defaultCommune: 'b',
      communes: [{ id: 'a', manifest: 'a/manifest.json' }],
    };
    expect(registrySchema.safeParse(data).success).toBe(false);
  });
});
