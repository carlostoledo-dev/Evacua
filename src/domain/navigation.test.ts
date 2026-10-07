import { describe, expect, it } from 'vitest';
import { headingAlong, maneuvers, nextManeuver, streetLegs } from './navigation.ts';

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

describe('maneuvers', () => {
  it('lists every turn in order, then the arrival on the last street', () => {
    // North on Freire, right onto Lautaro, left onto Cousiño, then the destination.
    const path: [number, number][] = [
      [LON, LAT],
      [LON, north(5)],
      [LON, north(100)],
      [east(80), north(100)],
      [east(80), north(200)],
    ];
    const list = maneuvers(path, [null, 'Freire', 'Lautaro', 'Cousiño']);
    expect(list.map((m) => m.kind)).toEqual(['right', 'left', 'arrive']);
    expect(list.map((m) => m.street)).toEqual(['Lautaro', 'Cousiño', 'Cousiño']);
    expect(list[1]?.meters).toBeGreaterThan(175);
    expect(list[2]?.meters).toBeGreaterThan(list[1]?.meters ?? Infinity);
  });

  it('is empty without a path to walk', () => {
    expect(maneuvers([[LON, LAT]], [])).toEqual([]);
  });
});

describe('streetLegs', () => {
  it('gives one leg per street, with the turn onto it, ignoring bends and short connectors', () => {
    const path: [number, number][] = [
      [LON, LAT],
      [LON, north(5)], // snap to the network (unnamed)
      [east(2), north(60)], // a bend on Freire
      [LON, north(120)],
      [east(10), north(120)], // 10 m connector
      [east(90), north(120)],
      [east(90), north(220)],
    ];
    const legs = streetLegs(path, [null, 'Freire', 'Freire', 'Paso', 'Lautaro', 'Cousiño']);
    expect(legs.map((l) => l.street)).toEqual(['Freire', 'Lautaro', 'Cousiño']);
    expect(legs.map((l) => l.turn)).toEqual([null, 'right', 'left']);
    expect(legs[0]?.meters).toBeGreaterThan(115);
  });
});
