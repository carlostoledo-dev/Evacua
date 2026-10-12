import { describe, expect, it } from 'vitest';
import type { EvacuationPlan } from '../../domain/routing.ts';
import { arrivalAt } from './useNavigation.ts';

const MEETING: [number, number] = [-73.15, -37.0];

function routeTo(destination: [number, number]): EvacuationPlan {
  return {
    kind: 'route',
    inDangerZone: false,
    destination: { kind: 'meeting-point', code: '08102PE031', coordinates: destination },
    path: [[-73.151, -37.0], destination],
    streets: [null],
    segments: ['off-network'],
    trailMeters: 0,
    meters: 90,
    time: { fastestMinutes: 1, slowestMinutes: 1 },
    metersToSafety: null,
    timeToSafety: null,
  };
}

describe('arrivalAt', () => {
  it('arrives within the arrival radius of the meeting point, not before', () => {
    expect(arrivalAt([-73.1501, -37.0], routeTo(MEETING))).toEqual({
      kind: 'meeting-point',
      code: '08102PE031',
      coordinates: MEETING,
    });
    expect(arrivalAt([-73.151, -37.0], routeTo(MEETING))).toBeNull();
  });

  it('a route to safe ground arrives once the plan says the user is already safe', () => {
    expect(arrivalAt([-73.16, -36.98], { kind: 'already-safe' })).toEqual({
      kind: 'safe-area',
      coordinates: [-73.16, -36.98],
    });
  });

  it('no plan, or no route from here, is not an arrival', () => {
    expect(arrivalAt(MEETING, null)).toBeNull();
    expect(arrivalAt(MEETING, { kind: 'outside-service-area' })).toBeNull();
  });
});
