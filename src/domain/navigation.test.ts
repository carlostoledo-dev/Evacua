import { describe, expect, it } from 'vitest';
import { headingAlong, nextManeuver } from './navigation.ts';

// Around Coronel: 0.001° of latitude ≈ 111 m, of longitude ≈ 89 m.
const LON = -73.15;
const LAT = -37.02;
const east = (m: number): number => LON + m / 89_000;
const north = (m: number): number => LAT + m / 111_000;

describe('nextManeuver', () => {
  it('announces a right turn at the corner, with its distance and the new street', () => {
    // Walk 100 m north on Freire, then turn east onto Lautaro.
    const path: [number, number][] = [
      [LON, LAT],
      [LON, north(5)],
      [LON, north(100)],
      [east(80), north(100)],
    ];
    const next = nextManeuver(path, [null, 'Freire', 'Lautaro']);
    expect(next?.kind).toBe('right');
    expect(next?.street).toBe('Lautaro');
    expect(next?.meters).toBeGreaterThan(95);
    expect(next?.meters).toBeLessThan(105);
  });

  it('turning west from a northbound street is a left turn', () => {
    const path: [number, number][] = [
      [LON, LAT],
      [LON, north(60)],
      [east(-60), north(60)],
    ];
    expect(nextManeuver(path, ['Freire', 'Cousiño'])?.kind).toBe('left');
  });

  it('ignores the bends of a curved street and says "keep going until you arrive"', () => {
    const path: [number, number][] = [[LON, LAT]];
    for (let m = 10; m <= 200; m += 10) path.push([east(Math.sin(m / 60) * 4), north(m)]);
    const next = nextManeuver(path, Array<string>(path.length - 1).fill('Yobilo'));
    expect(next?.kind).toBe('arrive');
    expect(next?.street).toBe('Yobilo');
    expect(next?.meters).toBeGreaterThan(195);
  });

  it('never announces a turn onto the short walk from the position to the street', () => {
    // The user stands 8 m off the street; the snap segment points east, the street goes north.
    const path: [number, number][] = [
      [LON, LAT],
      [east(8), LAT],
      [east(8), north(150)],
    ];
    expect(nextManeuver(path, [null, 'Freire'])?.kind).toBe('arrive');
  });

  it('has nothing to say without a route', () => {
    expect(nextManeuver([[LON, LAT]], [])).toBeNull();
  });
});

describe('headingAlong', () => {
  it('points where to walk now', () => {
    const heading = headingAlong([
      [LON, LAT],
      [east(100), LAT],
    ]);
    expect(heading).toBeGreaterThan(85);
    expect(heading).toBeLessThan(95);
  });
});
