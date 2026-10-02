// One-shot GPS reading behind an explicit result type. A single reading on request (no
// continuous tracking) saves battery. The position stays in memory: never stored or sent.

export type GeoErrorKind = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export type GeoResult =
  | { ok: true; position: [number, number]; accuracyMeters: number }
  | { ok: false; error: GeoErrorKind };

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20_000, // a cold GPS start outdoors can take a while
  maximumAge: 30_000, // a reading from the last 30 s is fresh enough on foot
};

export function getCurrentPosition(
  geolocation: Geolocation | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.geolocation,
): Promise<GeoResult> {
  if (!geolocation) return Promise.resolve({ ok: false, error: 'unsupported' });
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          position: [position.coords.longitude, position.coords.latitude],
          accuracyMeters: position.coords.accuracy,
        });
      },
      (error) => {
        const kind: GeoErrorKind =
          error.code === error.PERMISSION_DENIED
            ? 'denied'
            : error.code === error.TIMEOUT
              ? 'timeout'
              : 'unavailable';
        resolve({ ok: false, error: kind });
      },
      OPTIONS,
    );
  });
}
