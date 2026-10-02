// Pure geographic helpers (WGS84, [lon, lat] order like GeoJSON).

// Tuples ([lon, lat]) are assignable to this; extra numbers (altitude) are ignored.
export type LonLat = readonly number[];

const EARTH_RADIUS_M = 6_371_008.8; // mean Earth radius (IUGG)

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in meters. */
export function haversineMeters(a: LonLat, b: LonLat): number {
  const [lon1 = 0, lat1 = 0] = a;
  const [lon2 = 0, lat2 = 0] = b;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from `a` to `b`, in degrees clockwise from north (0–360). */
export function bearingDegrees(a: LonLat, b: LonLat): number {
  const [lon1 = 0, lat1 = 0] = a;
  const [lon2 = 0, lat2 = 0] = b;
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type CompassPoint = (typeof COMPASS_POINTS)[number];

/** Nearest of the 8 compass points for a bearing. */
export function compassPoint(bearing: number): CompassPoint {
  const index = Math.round((((bearing % 360) + 360) % 360) / 45) % 8;
  return COMPASS_POINTS[index] ?? 'N';
}

/** [west, south, east, north] contains the point (edges included). */
export function insideBounds(point: LonLat, bounds: readonly number[]): boolean {
  const [lon = NaN, lat = NaN] = point;
  const [west = 0, south = 0, east = 0, north = 0] = bounds;
  return lon >= west && lon <= east && lat >= south && lat <= north;
}

/** Ray casting on one ring. */
function insideRing(point: LonLat, ring: readonly LonLat[]): boolean {
  const [x = 0, y = 0] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi = 0, yi = 0] = ring[i] ?? [];
    const [xj = 0, yj = 0] = ring[j] ?? [];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Point in a GeoJSON Polygon (first ring = shell, others = holes). */
export function insidePolygon(point: LonLat, rings: readonly (readonly LonLat[])[]): boolean {
  const [shell, ...holes] = rings;
  if (!shell || !insideRing(point, shell)) return false;
  return !holes.some((hole) => insideRing(point, hole));
}

export type AreaGeometry =
  | { type: 'Polygon'; coordinates: readonly (readonly LonLat[])[] }
  | { type: 'MultiPolygon'; coordinates: readonly (readonly (readonly LonLat[])[])[] };

export function insideArea(point: LonLat, area: AreaGeometry): boolean {
  if (area.type === 'Polygon') return insidePolygon(point, area.coordinates);
  return area.coordinates.some((polygon) => insidePolygon(point, polygon));
}

// ---------------------------------------------------------------------------------------------
// Prepared areas: the same ray casting, indexed by latitude bands so testing thousands of points
// (every node of the walking network) stays fast on low-end phones.

interface PreparedRing {
  minLat: number;
  bandHeight: number;
  /** Edge endpoints [x1, y1, x2, y2] grouped by the latitude bands they span. */
  bands: Float64Array[];
  bounds: [number, number, number, number];
}

export interface PreparedArea {
  /** One entry per polygon: shell first, then holes. */
  polygons: PreparedRing[][];
}

const BAND_COUNT = 128;

function prepareRing(ring: readonly LonLat[]): PreparedRing {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lon = 0, lat = 0] of ring) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  const bandHeight = (maxLat - minLat) / BAND_COUNT || 1;
  const buckets: number[][] = Array.from({ length: BAND_COUNT }, () => []);
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1 = 0, y1 = 0] = ring[j] ?? [];
    const [x2 = 0, y2 = 0] = ring[i] ?? [];
    const from = Math.max(0, Math.floor((Math.min(y1, y2) - minLat) / bandHeight));
    const to = Math.min(BAND_COUNT - 1, Math.floor((Math.max(y1, y2) - minLat) / bandHeight));
    for (let b = from; b <= to; b++) buckets[b]?.push(x1, y1, x2, y2);
  }
  return {
    minLat,
    bandHeight,
    bands: buckets.map((edges) => Float64Array.from(edges)),
    bounds: [minLon, minLat, maxLon, maxLat],
  };
}

function insidePreparedRing(lon: number, lat: number, ring: PreparedRing): boolean {
  const [minLon, minLat, maxLon, maxLat] = ring.bounds;
  if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) return false;
  const band =
    ring.bands[Math.min(BAND_COUNT - 1, Math.floor((lat - ring.minLat) / ring.bandHeight))];
  if (!band) return false;
  let inside = false;
  for (let k = 0; k < band.length; k += 4) {
    const x1 = band[k] ?? 0;
    const y1 = band[k + 1] ?? 0;
    const x2 = band[k + 2] ?? 0;
    const y2 = band[k + 3] ?? 0;
    if (y2 > lat !== y1 > lat && lon < ((x1 - x2) * (lat - y2)) / (y1 - y2) + x2) inside = !inside;
  }
  return inside;
}

export function prepareArea(area: AreaGeometry): PreparedArea {
  const polygons = area.type === 'Polygon' ? [area.coordinates] : area.coordinates;
  return { polygons: polygons.map((rings) => rings.map(prepareRing)) };
}

/** Same answer as insideArea, much faster for repeated queries. */
export function insidePreparedArea(point: LonLat, area: PreparedArea): boolean {
  const [lon = NaN, lat = NaN] = point;
  return area.polygons.some(([shell, ...holes]) => {
    if (!shell || !insidePreparedRing(lon, lat, shell)) return false;
    return !holes.some((hole) => insidePreparedRing(lon, lat, hole));
  });
}
