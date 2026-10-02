import { describe, expect, it } from 'vitest';
import { AVAILABLE_HAZARDS, DEFAULT_HAZARD, HAZARDS, layersForHazard } from './hazards.ts';

const layers = [
  { id: 'tsunami-area', hazards: ['tsunami'] as const },
  { id: 'fuel', hazards: ['wildfire'] as const },
  { id: 'both', hazards: ['tsunami', 'wildfire'] as const },
];

describe('hazards', () => {
  it('offers tsunami and earthquake, not wildfire (owner decision D2 = C)', () => {
    expect(AVAILABLE_HAZARDS).toEqual(['tsunami', 'earthquake']);
    expect(HAZARDS.wildfire.available).toBe(false);
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
