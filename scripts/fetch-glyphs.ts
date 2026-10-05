// Downloads the map label glyphs (Noto Sans, SIL Open Font License) so labels render offline.
// Only the Latin ranges are needed for Spanish and English street names (includes ñ, á, é…).
//
//   npm run data:glyphs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ASSETS = 'https://raw.githubusercontent.com/protomaps/basemaps-assets/main/fonts';
// One weight only: every label uses Regular, which keeps the offline bundle small.
const FONTS = ['Noto Sans Regular'];
const RANGES = ['0-255', '256-511', '8192-8447']; // Basic Latin + Latin-1, Latin Extended-A, punctuation

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${String(response.status)} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

for (const font of FONTS) {
  for (const range of RANGES) {
    const data = await download(`${ASSETS}/${encodeURIComponent(font)}/${range}.pbf`);
    const target = path.join('public', 'fonts', font, `${range}.pbf`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
  }
}
await writeFile(path.join('public', 'fonts', 'OFL.txt'), await download(`${ASSETS}/OFL.txt`));
console.log(`glyphs: ${String(FONTS.length * RANGES.length)} files + OFL.txt → public/fonts`);
