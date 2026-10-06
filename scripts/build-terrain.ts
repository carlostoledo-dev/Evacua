// Reproducible extract of offline elevation tiles for one commune (relief in the 3D view).
//
//   npm run data:terrain                        (commune "coronel")
//   node scripts/build-terrain.ts coronel
//
// Downloads Terrain Tiles (Terrarium PNG encoding) from the AWS Open Data bucket
// `elevation-tiles-prod` (https://registry.opendata.aws/terrain-tiles/), keeps only the tiles
// covering the commune's data bounds for zooms MIN_ZOOM..MAX_ZOOM, writes
// public/terrain/<commune>/{z}/{x}/{y}.png and records them (with provenance) in the manifest.
// The app serves and precaches these static files; nothing is fetched at runtime.
//
// For Chile the tiles are built from SRTM and GMTED2010 (USGS) and ETOPO1 (NOAA). Required
// attribution: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { boundsSchema, formatIssues, manifestSchema } from '../src/data/schema.ts';
import { tilesFor } from './lib/tiles.ts';

const MIN_ZOOM = 10;
// At this latitude z13 is ≈ 15 m per pixel, already finer than SRTM (≈ 30 m): higher zooms
// would only be upsampled copies. MapLibre overzooms the relief beyond this.
const MAX_ZOOM = 13;
const TILE_SIZE = 256;
const BASE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';

async function main(): Promise<void> {
  const communeId = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'coronel';
  const manifestPath = path.join('public', 'data', 'communes', communeId, 'manifest.json');
  const manifestJson = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
  const boundsResult = boundsSchema.safeParse(manifestJson.bounds);
  if (!boundsResult.success) throw new Error(formatIssues(boundsResult.error).join('\n'));
  const bounds = boundsResult.data;

  const outDir = path.join('public', 'terrain', communeId);
  await rm(outDir, { recursive: true, force: true });
  let count = 0;
  let bytes = 0;
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    for (const [x, y] of tilesFor(bounds, z)) {
      const url = `${BASE}/${String(z)}/${String(x)}/${String(y)}.png`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${String(response.status)} for ${url}`);
      const data = Buffer.from(await response.arrayBuffer());
      // PNG signature: never ship an error page as a tile.
      if (data.subarray(0, 4).toString('hex') !== '89504e47') throw new Error(`not a PNG: ${url}`);
      const file = path.join(outDir, String(z), String(x), `${String(y)}.png`);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, data);
      count++;
      bytes += data.length;
    }
  }

  const terrain = {
    tiles: `/terrain/${communeId}/{z}/{x}/{y}.png`,
    encoding: 'terrarium',
    tileSize: TILE_SIZE,
    minzoom: MIN_ZOOM,
    maxzoom: MAX_ZOOM,
    // Short on the map (phones); the full credit lines are in `source` and DATA_SOURCES.md.
    attribution: 'Relieve: USGS, NOAA',
    source:
      'Terrain Tiles (Tilezen/Mapzen) on AWS Open Data, s3://elevation-tiles-prod/terrarium ' +
      '(https://registry.opendata.aws/terrain-tiles/). For Chile: SRTM data courtesy of the ' +
      'U.S. Geological Survey; GMTED2010 data courtesy of the U.S. Geological Survey; ETOPO1: ' +
      'DOC/NOAA/NESDIS/NCEI > National Centers for Environmental Information, NESDIS, NOAA, ' +
      'U.S. Department of Commerce',
    license:
      'Public domain (U.S. Government works), attribution requested; see ' +
      'https://github.com/tilezen/joerd/blob/master/docs/attribution.md',
    retrievedAt: new Date().toISOString().slice(0, 10),
  };
  const updated = manifestSchema.safeParse({ ...manifestJson, terrain });
  if (!updated.success) throw new Error(formatIssues(updated.error).join('\n'));
  await writeFile(manifestPath, `${JSON.stringify(updated.data, null, 2)}\n`);
  console.log(`${String(count)} tiles, ${(bytes / 1024).toFixed(0)} KB → ${outDir}`);
}

await main();
