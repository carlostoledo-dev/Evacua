// Validates every commune in public/data with the same code the app runs in the browser.
// Runs before every build: invalid or unlabeled data never ships.
import { pathToFileURL } from 'node:url';
import { loadCommune, loadRegistry } from '../src/data/loader.ts';
import { fsFetcher } from './lib/fs-fetcher.ts';

const registryUrl = pathToFileURL('public/data/communes/index.json').href;

const registry = await loadRegistry(fsFetcher, registryUrl);
if (!registry.ok) {
  console.error(`✗ ${registry.error.resource} (${registry.error.kind})`, registry.error.issues);
  process.exit(1);
}

let failed = false;
for (const commune of registry.value.communes) {
  const result = await loadCommune(fsFetcher, new URL(commune.manifest, registryUrl).href);
  if (!result.ok) {
    failed = true;
    console.error(`✗ ${commune.id}: ${result.error.kind} in ${result.error.resource}`);
    for (const issue of result.error.issues) console.error(`    ${issue}`);
    continue;
  }
  console.log(`✓ ${commune.id} (${result.value.manifest.sector.name})`);
  for (const layer of result.value.layers) {
    const count = String(layer.collection.features.length).padStart(3);
    console.log(`    ${layer.status.padEnd(8)} ${count} × ${layer.entry.id}`);
  }
}

if (failed) process.exit(1);
