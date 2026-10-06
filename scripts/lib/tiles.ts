// Web Mercator tile math shared by the offline tile scripts (basemap and terrain).
import type { Bounds } from '../../src/data/schema.ts';

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
