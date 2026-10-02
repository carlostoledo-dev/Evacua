// Reproducible extract of offline basemap tiles for one commune.
//
//   npm run data:tiles                          (commune "coronel", latest Protomaps build)
//   node scripts/build-tiles.ts coronel --build=20261002
//
// Reads OpenStreetMap vector tiles (Protomaps basemap, ODbL data) from a public daily planet
// build via HTTP range requests, keeps only the tiles covering the commune's data bounds for
// zooms MIN_ZOOM..MAX_ZOOM, writes public/tiles/<commune>/{z}/{x}/{y}.mvt and records the basemap
// (with provenance) in the commune manifest. The app serves and precaches these static files.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { PMTiles, FetchSource } from 'pmtiles';
import { boundsSchema, formatIssues, manifestSchema, type Bounds } from '../src/data/schema.ts';

const MIN_ZOOM = 12;
const MAX_ZOOM = 15; // Protomaps builds stop at 15; MapLibre overzooms beyond.
const BUILDS_INDEX = 'https://build-metadata.protomaps.dev/builds.json';
const BUILD_BASE = 'https://build.protomaps.com/';

function lonToTileX(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z);
}

/** Every tile intersecting `bounds` at zoom `z`. */
export function tilesFor(bounds: Bounds, z: number): [number, number][] {
  const [west, south, east, north] = bounds;
  const tiles: [number, number][] = [];
  for (let x = lonToTileX(west, z); x <= lonToTileX(east, z); x++) {
    for (let y = latToTileY(north, z); y <= latToTileY(south, z); y++) tiles.push([x, y]);
  }
  return tiles;
}

async function latestBuild(): Promise<string> {
  const response = await fetch(BUILDS_INDEX);
  if (!response.ok) throw new Error(`HTTP ${String(response.status)} for ${BUILDS_INDEX}`);
  const builds = (await response.json()) as { key: string }[];
  const last = builds.at(-1);
  if (!last) throw new Error('no Protomaps builds listed');
  return last.key.replace(/\.pmtiles$/, '');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const communeId = args.find((a) => !a.startsWith('--')) ?? 'coronel';
  const build = args.find((a) => a.startsWith('--build='))?.slice(8) ?? (await latestBuild());
  if (!/^\d{8}$/.test(build)) throw new Error(`invalid --build "${build}"`);

  const manifestPath = path.join('public', 'data', 'communes', communeId, 'manifest.json');
  // Read only the bounds: this script is what adds `basemap`, so the manifest may lack it yet.
  const manifestJson = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
  const boundsResult = boundsSchema.safeParse(manifestJson.bounds);
  if (!boundsResult.success) throw new Error(formatIssues(boundsResult.error).join('\n'));
  const bounds = boundsResult.data;

  const url = `${BUILD_BASE}${build}.pmtiles`;
  const archive = new PMTiles(new FetchSource(url));
  await archive.getHeader(); // fails early if the build URL is wrong
  const outDir = path.join('public', 'tiles', communeId);
  await rm(outDir, { recursive: true, force: true });

  let count = 0;
  let bytes = 0;
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    for (const [x, y] of tilesFor(bounds, z)) {
      const tile = await archive.getZxy(z, x, y);
      if (!tile) continue; // empty ocean tiles are omitted by the build
      const raw = Buffer.from(tile.data);
      // The pmtiles library usually returns tiles already decompressed; gunzip only if the
      // bytes still carry the gzip magic number, so static hosting needs no Content-Encoding.
      const data = raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw;
      const file = path.join(outDir, String(z), String(x), `${String(y)}.mvt`);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, data);
      count++;
      bytes += data.length;
    }
  }

  const basemap = {
    tiles: `/tiles/${communeId}/{z}/{x}/{y}.mvt`,
    minzoom: MIN_ZOOM,
    maxzoom: MAX_ZOOM,
    attribution: '© OpenStreetMap contributors',
    source: `Protomaps basemap daily build ${build} (${url})`,
    license: 'ODbL-1.0 (OpenStreetMap data)',
    retrievedAt: new Date().toISOString().slice(0, 10),
  };
  // The manifest is the single description of a commune's data, basemap included.
  const updated = manifestSchema.safeParse({ ...manifestJson, basemap });
  if (!updated.success) throw new Error(formatIssues(updated.error).join('\n'));
  await writeFile(manifestPath, `${JSON.stringify(updated.data, null, 2)}\n`);
  console.log(
    `${String(count)} tiles, ${(bytes / 1024).toFixed(0)} KB → ${outDir} (build ${build})`,
  );
}

await main();
