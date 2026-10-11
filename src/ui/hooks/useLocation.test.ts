import { describe, expect, it } from 'vitest';
import { trackedState, type LocationState } from './useLocation.ts';

const READING: LocationState = {
  kind: 'gps',
  position: [-73.152, -37.01],
  accuracyMeters: 12,
  signalLost: false,
};

describe('trackedState', () => {
  it('takes every new GPS reading and clears a lost signal', () => {
    const lost: LocationState = { ...READING, signalLost: true };
    expect(trackedState(lost, { ok: true, position: [-73.15, -37.02], accuracyMeters: 8 })).toEqual(
      { kind: 'gps', position: [-73.15, -37.02], accuracyMeters: 8, signalLost: false },
    );
  });

  it('keeps the last reading, flagged, when the signal is lost for a moment', () => {
    expect(trackedState(READING, { ok: false, error: 'timeout' })).toEqual({
      ...READING,
      signalLost: true,
    });
    expect(trackedState(READING, { ok: false, error: 'unavailable' })).toEqual({
      ...READING,
      signalLost: true,
    });
  });

  it('shows the error when the user must act (permission revoked, no GPS)', () => {
    expect(trackedState(READING, { ok: false, error: 'denied' })).toEqual({
      kind: 'gps-error',
      error: 'denied',
    });
    expect(trackedState(READING, { ok: false, error: 'unsupported' })).toEqual({
      kind: 'gps-error',
      error: 'unsupported',
    });
  });

  it('shows the error when there is no earlier GPS reading to keep', () => {
    expect(trackedState({ kind: 'locating' }, { ok: false, error: 'timeout' })).toEqual({
      kind: 'gps-error',
      error: 'timeout',
    });
    // A point picked on the map is not a GPS reading: it is never passed off as one.
    expect(
      trackedState({ kind: 'manual', position: [-73.15, -37.0] }, { ok: false, error: 'timeout' }),
    ).toEqual({ kind: 'gps-error', error: 'timeout' });
  });
});
