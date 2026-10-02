import { describe, expect, it } from 'vitest';
import { getCurrentPosition } from './geolocation.ts';

const CODES = { PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as const;

function fakeGeolocation(outcome: { coords: [number, number, number] } | { code: 1 | 2 | 3 }) {
  return {
    getCurrentPosition(success: PositionCallback, failure?: PositionErrorCallback | null) {
      if ('coords' in outcome) {
        const [longitude, latitude, accuracy] = outcome.coords;
        success({ coords: { longitude, latitude, accuracy } } as GeolocationPosition);
      } else {
        failure?.({ code: outcome.code, message: '', ...CODES });
      }
    },
  } as unknown as Geolocation;
}

describe('getCurrentPosition', () => {
  it('returns [lon, lat] and accuracy', async () => {
    await expect(
      getCurrentPosition(fakeGeolocation({ coords: [-73.15, -37.01, 12] })),
    ).resolves.toEqual({
      ok: true,
      position: [-73.15, -37.01],
      accuracyMeters: 12,
    });
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ] as const)('maps error code %i to "%s"', async (code, kind) => {
    await expect(getCurrentPosition(fakeGeolocation({ code }))).resolves.toEqual({
      ok: false,
      error: kind,
    });
  });

  it('reports unsupported browsers instead of throwing', async () => {
    await expect(getCurrentPosition(undefined)).resolves.toEqual({
      ok: false,
      error: 'unsupported',
    });
  });
});
