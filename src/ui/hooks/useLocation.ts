import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCurrentPosition,
  watchPosition,
  type GeoErrorKind,
} from '../../platform/geolocation.ts';

/** Where the user is, and how we know it. Lives in memory only: never stored or sent. */
export type LocationState =
  | { kind: 'none' }
  | { kind: 'locating' }
  | { kind: 'gps-error'; error: GeoErrorKind }
  | { kind: 'picking' }
  | { kind: 'gps'; position: [number, number]; accuracyMeters: number }
  | { kind: 'manual'; position: [number, number] }
  /** Simulated: a preset DEMO point (`demoId`), or a DEMO walk from a picked point (null). */
  | { kind: 'demo'; position: [number, number]; demoId: string | null };

export function locationPosition(state: LocationState): [number, number] | null {
  return 'position' in state ? state.position : null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ kind: 'none' });
  // Ignore a late GPS answer if the user picked something else meanwhile.
  const requestRef = useRef(0);
  // Continuous GPS (navigation only); every other action stops it.
  const stopWatchRef = useRef<(() => void) | null>(null);
  const stopTracking = useCallback(() => {
    stopWatchRef.current?.();
    stopWatchRef.current = null;
  }, []);
  useEffect(() => stopTracking, [stopTracking]);

  const locateWithGps = useCallback(() => {
    stopTracking();
    const request = ++requestRef.current;
    setState({ kind: 'locating' });
    void getCurrentPosition().then((result) => {
      if (request !== requestRef.current) return;
      setState(
        result.ok
          ? { kind: 'gps', position: result.position, accuracyMeters: result.accuracyMeters }
          : { kind: 'gps-error', error: result.error },
      );
    });
  }, [stopTracking]);

  /** Follows the GPS until stopped (turn-by-turn navigation). Keeps the last position meanwhile. */
  const track = useCallback(() => {
    stopTracking();
    const request = ++requestRef.current;
    setState((previous) => ('position' in previous ? previous : { kind: 'locating' }));
    stopWatchRef.current = watchPosition((result) => {
      if (request !== requestRef.current) return;
      setState(
        result.ok
          ? { kind: 'gps', position: result.position, accuracyMeters: result.accuracyMeters }
          : { kind: 'gps-error', error: result.error },
      );
    });
  }, [stopTracking]);

  const simulate = useCallback(
    (demoId: string | null, position: [number, number]) => {
      stopTracking();
      requestRef.current++;
      setState({ kind: 'demo', demoId, position });
    },
    [stopTracking],
  );

  const startPicking = useCallback(() => {
    stopTracking();
    requestRef.current++;
    setState({ kind: 'picking' });
  }, [stopTracking]);

  const pick = useCallback(
    (position: [number, number]) => {
      stopTracking();
      setState({ kind: 'manual', position });
    },
    [stopTracking],
  );

  const clear = useCallback(() => {
    stopTracking();
    requestRef.current++;
    setState({ kind: 'none' });
  }, [stopTracking]);

  return { state, locateWithGps, track, stopTracking, simulate, startPicking, pick, clear };
}
