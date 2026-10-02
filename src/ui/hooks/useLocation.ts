import { useCallback, useRef, useState } from 'react';
import { getCurrentPosition, type GeoErrorKind } from '../../platform/geolocation.ts';

/** Where the user is, and how we know it. Lives in memory only: never stored or sent. */
export type LocationState =
  | { kind: 'none' }
  | { kind: 'locating' }
  | { kind: 'gps-error'; error: GeoErrorKind }
  | { kind: 'picking' }
  | { kind: 'gps'; position: [number, number]; accuracyMeters: number }
  | { kind: 'manual'; position: [number, number] }
  | { kind: 'demo'; position: [number, number]; demoId: string };

export function locationPosition(state: LocationState): [number, number] | null {
  return 'position' in state ? state.position : null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ kind: 'none' });
  // Ignore a late GPS answer if the user picked something else meanwhile.
  const requestRef = useRef(0);

  const locateWithGps = useCallback(() => {
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
  }, []);

  const simulate = useCallback((demoId: string, position: [number, number]) => {
    requestRef.current++;
    setState({ kind: 'demo', demoId, position });
  }, []);

  const startPicking = useCallback(() => {
    requestRef.current++;
    setState({ kind: 'picking' });
  }, []);

  const pick = useCallback((position: [number, number]) => {
    setState({ kind: 'manual', position });
  }, []);

  const clear = useCallback(() => {
    requestRef.current++;
    setState({ kind: 'none' });
  }, []);

  return { state, locateWithGps, simulate, startPicking, pick, clear };
}
