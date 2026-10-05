import { describe, expect, it } from 'vitest';
import {
  AVAILABLE_HAZARDS,
  DEFAULT_HAZARD,
  HAZARD_CHOICE,
  HAZARDS,
  layersForHazard,
} from './hazards.ts';

const layers = [
  { id: 'tsunami-area', hazards: ['tsunami'] as const },
  { id: 'fuel', hazards: ['wildfire'] as const },
  { id: 'both', hazards: ['tsunami', 'wildfire'] as const },
];

describe('hazards', () => {
  it('offers tsunami only, so there is no hazard selector (owner decision 2026-10-04)', () => {
    expect(AVAILABLE_HAZARDS).toEqual(['tsunami']);
    expect(HAZARDS.earthquake.available).toBe(false);
    expect(HAZARDS.wildfire.available).toBe(false);
    expect(HAZARD_CHOICE).toBe(false);
  });

  it('defaults to an available hazard', () => {
    expect(AVAILABLE_HAZARDS).toContain(DEFAULT_HAZARD);
  });

  it('shows tsunami layers for tsunami, in order', () => {
    expect(layersForHazard('tsunami', layers).map((l) => l.id)).toEqual(['tsunami-area', 'both']);
  });

  it('reuses the tsunami layers for earthquake', () => {
    expect(layersForHazard('earthquake', layers).map((l) => l.id)).toEqual([
      'tsunami-area',
      'both',
    ]);
  });

  it('keeps wildfire layers apart', () => {
    expect(layersForHazard('wildfire', layers).map((l) => l.id)).toEqual(['fuel', 'both']);
  });
});
