import { describe, expect, it } from 'vitest';
import {
  bearingDegrees,
  compassPoint,
  haversineMeters,
  insideArea,
  insideBounds,
  insidePolygon,
  insidePreparedArea,
  prepareArea,
} from './geo.ts';

describe('haversineMeters', () => {
  it('is zero for the same point', () => {
    expect(haversineMeters([-73.15, -37], [-73.15, -37])).toBe(0);
  });

  it('measures one degree of latitude as ≈ 111.2 km', () => {
    expect(haversineMeters([0, 0], [0, 1])).toBeCloseTo(111_195, -2);
  });

  it('is symmetric', () => {
    const a = [-73.152, -37.01] as const;
    const b = [-73.143, -37.007] as const;
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });
});

describe('bearingDegrees / compassPoint', () => {
  it('points north, east, south and west', () => {
    expect(bearingDegrees([0, 0], [0, 1])).toBeCloseTo(0, 6);
    expect(bearingDegrees([0, 0], [1, 0])).toBeCloseTo(90, 6);
    expect(bearingDegrees([0, 1], [0, 0])).toBeCloseTo(180, 6);
    expect(bearingDegrees([1, 0], [0, 0])).toBeCloseTo(270, 6);
  });

  it('rounds to the nearest of 8 compass points', () => {
    expect(compassPoint(0)).toBe('N');
    expect(compassPoint(44)).toBe('NE');
    expect(compassPoint(100)).toBe('E');
    expect(compassPoint(350)).toBe('N');
    expect(compassPoint(-90)).toBe('W');
  });
});

describe('insideBounds', () => {
  it('includes edges and excludes outside points', () => {
    const bounds = [-73.2, -37.1, -73.1, -37.0];
    expect(insideBounds([-73.15, -37.05], bounds)).toBe(true);
    expect(insideBounds([-73.2, -37.0], bounds)).toBe(true);
    expect(insideBounds([-73.25, -37.05], bounds)).toBe(false);
  });
});

describe('insidePolygon / insideArea', () => {
  const shell = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ];
  const hole = [
    [4, 4],
    [6, 4],
    [6, 6],
    [4, 6],
    [4, 4],
  ];

  it('detects points inside the shell', () => {
    expect(insidePolygon([1, 1], [shell])).toBe(true);
    expect(insidePolygon([11, 1], [shell])).toBe(false);
  });

  it('treats holes as outside (safe zones inside the evacuation area)', () => {
    expect(insidePolygon([5, 5], [shell, hole])).toBe(false);
    expect(insidePolygon([2, 2], [shell, hole])).toBe(true);
  });

  it('handles MultiPolygons', () => {
    const other = shell.map(([x = 0, y = 0]) => [x + 20, y]);
    const area = { type: 'MultiPolygon', coordinates: [[shell], [other]] } as const;
    expect(insideArea([25, 5], area)).toBe(true);
    expect(insideArea([15, 5], area)).toBe(false);
  });
});

describe('prepareArea / insidePreparedArea', () => {
  it('gives exactly the same answers as insideArea, holes included', () => {
    const shell = [
      [0, 0],
      [10, 0],
      [12, 6],
      [10, 10],
      [0, 10],
      [0, 0],
    ];
    const hole = [
      [4, 4],
      [6, 4],
      [6, 6],
      [4, 6],
      [4, 4],
    ];
    const area = { type: 'Polygon', coordinates: [shell, hole] } as const;
    const prepared = prepareArea(area);
    for (let x = -1; x <= 13; x += 0.37) {
      for (let y = -1; y <= 11; y += 0.41) {
        expect(insidePreparedArea([x, y], prepared), `${String(x)},${String(y)}`).toBe(
          insideArea([x, y], area),
        );
      }
    }
  });
});
