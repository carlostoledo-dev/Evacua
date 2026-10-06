// GPS behind an explicit result type: one reading on request (saves battery), or continuous
// readings only while the user navigates. The position stays in memory: never stored or sent.

export type GeoErrorKind = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export type GeoResult =
  | { ok: true; position: [number, number]; accuracyMeters: number }
  | { ok: false; error: GeoErrorKind };

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20_000, // a cold GPS start outdoors can take a while
  maximumAge: 30_000, // a reading from the last 30 s is fresh enough on foot
};

/** While navigating, readings older than 2 s are stale on foot. */
const WATCH_OPTIONS: PositionOptions = { ...OPTIONS, maximumAge: 2_000 };

function browserGeolocation(): Geolocation | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.geolocation;
}

function toResult(position: GeolocationPosition): GeoResult {
  return {
    ok: true,
    position: [position.coords.longitude, position.coords.latitude],
    accuracyMeters: position.coords.accuracy,
  };
}

function toError(error: GeolocationPositionError): GeoResult {
  const kind: GeoErrorKind =
    error.code === error.PERMISSION_DENIED
      ? 'denied'
      : error.code === error.TIMEOUT
        ? 'timeout'
        : 'unavailable';
  return { ok: false, error: kind };
}

export function getCurrentPosition(
  geolocation: Geolocation | undefined = browserGeolocation(),
): Promise<GeoResult> {
  if (!geolocation) return Promise.resolve({ ok: false, error: 'unsupported' });
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => {
        resolve(toResult(position));
      },
      (error) => {
        resolve(toError(error));
      },
      OPTIONS,
    );
  });
}

/** Continuous readings for turn-by-turn navigation. Returns the function that stops them. */
export function watchPosition(
  onResult: (result: GeoResult) => void,
  geolocation: Geolocation | undefined = browserGeolocation(),
): () => void {
  if (!geolocation) {
    onResult({ ok: false, error: 'unsupported' });
    return () => undefined;
  }
  const id = geolocation.watchPosition(
    (position) => {
      onResult(toResult(position));
    },
    (error) => {
      onResult(toError(error));
    },
    WATCH_OPTIONS,
  );
  return () => {
    geolocation.clearWatch(id);
  };
}
