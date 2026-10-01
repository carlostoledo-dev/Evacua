import { useCallback, useEffect, useState } from 'react';
import { loadDefaultCommune, type CommuneData, type DataError } from '../../data/loader.ts';
import { REGISTRY_PATH } from '../../data/paths.ts';

export type CommuneState =
  | { status: 'loading' }
  | { status: 'ready'; data: CommuneData }
  | { status: 'error'; error: DataError };

/** Loads and validates the default commune's data; `retry` starts over after an error. */
export function useCommuneData(): { state: CommuneState; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CommuneState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const registryUrl = new URL(REGISTRY_PATH, window.location.origin).href;
    void loadDefaultCommune((url) => fetch(url), registryUrl).then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: 'ready', data: result.value }
          : { status: 'error', error: result.error },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  return { state, retry };
}
