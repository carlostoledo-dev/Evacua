import { describe, expect, it } from 'vitest';
import { mphToMetersPerSecond, PROFILE_AGE, WALKING_SPEED_MPS } from './constants.ts';

describe('PROFILE_AGE (Ley 21.430 and Ley 19.828, art. 1)', () => {
  it('uses the legal ages: child under 14, older adult from 60', () => {
    expect(PROFILE_AGE).toEqual({ childUnder: 14, seniorFrom: 60 });
  });
});

describe('mphToMetersPerSecond', () => {
  it('converts miles per hour to meters per second', () => {
    expect(mphToMetersPerSecond(1)).toBeCloseTo(0.44704, 5);
    expect(mphToMetersPerSecond(0)).toBe(0);
  });
});

describe('WALKING_SPEED_MPS (FEMA P-646, 3rd ed., p. 5-2)', () => {
  it('uses 4 mph for an average healthy adult', () => {
    expect(WALKING_SPEED_MPS.averageHealthyAdult).toBeCloseTo(1.788, 3);
  });

  it('uses 2 mph for a mobility-impaired population', () => {
    expect(WALKING_SPEED_MPS.mobilityImpaired).toBeCloseTo(0.894, 3);
  });

  it('keeps the mobility-impaired pace slower', () => {
    expect(WALKING_SPEED_MPS.mobilityImpaired).toBeLessThan(WALKING_SPEED_MPS.averageHealthyAdult);
  });
});
