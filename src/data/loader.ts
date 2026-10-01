// Data access: fetch → parse → validate. Returns explicit results instead of throwing, so the
// UI can show a specific state (offline without cache, missing file, invalid data).
import type { z } from 'zod';
import { checkLayerConsistency, layerStatus, type LayerStatus } from './consistency.ts';
import {
  formatIssues,
  layerSchemas,
  manifestSchema,
  registrySchema,
  type LayerCollection,
  type LayerEntry,
  type Manifest,
  type Registry,
  type Source,
} from './schema.ts';

export type DataErrorKind = 'network' | 'not-found' | 'invalid';

export interface DataError {
  kind: DataErrorKind;
  resource: string;
  issues: string[];
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: DataError };

/** Same contract as `fetch`; injected so tests and build scripts can serve local files. */
export type Fetcher = (url: string) => Promise<Response>;

export interface LoadedLayer {
  entry: LayerEntry;
  source: Source;
  collection: LayerCollection;
  status: LayerStatus;
}

export interface CommuneData {
  manifest: Manifest;
  layers: LoadedLayer[];
}

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

function fail<T>(kind: DataErrorKind, resource: string, issues: string[] = []): Result<T> {
  return { ok: false, error: { kind, resource, issues } };
}

/** Resolves `path` against `base` and refuses anything that would leave the base's origin. */
function resolveSameOrigin(path: string, base: string): string | null {
  const resolved = new URL(path, base);
  return resolved.origin === new URL(base).origin ? resolved.href : null;
}

async function fetchJson(fetcher: Fetcher, url: string): Promise<Result<unknown>> {
  let response: Response;
  try {
    response = await fetcher(url);
  } catch {
    return fail('network', url);
  }
  if (response.status === 404) return fail('not-found', url);
  if (!response.ok) return fail('network', url, [`HTTP ${String(response.status)}`]);
  try {
    return ok(await response.json());
  } catch {
    return fail('invalid', url, ['not valid JSON']);
  }
}

async function fetchValidated<S extends z.ZodType>(
  fetcher: Fetcher,
  url: string,
  schema: S,
): Promise<Result<z.infer<S>>> {
  const raw = await fetchJson(fetcher, url);
  if (!raw.ok) return raw;
  const parsed = schema.safeParse(raw.value);
  return parsed.success ? ok(parsed.data) : fail('invalid', url, formatIssues(parsed.error));
}

export function loadRegistry(fetcher: Fetcher, registryUrl: string): Promise<Result<Registry>> {
  return fetchValidated(fetcher, registryUrl, registrySchema);
}

async function loadLayer(
  fetcher: Fetcher,
  manifestUrl: string,
  manifest: Manifest,
  entry: LayerEntry,
): Promise<Result<LoadedLayer>> {
  const url = resolveSameOrigin(entry.file, manifestUrl);
  if (!url) return fail('invalid', entry.file, ['layer path leaves the data origin']);
  const collection = await fetchValidated(fetcher, url, layerSchemas[entry.role]);
  if (!collection.ok) return collection;

  const source = manifest.sources.find((candidate) => candidate.id === entry.sourceId);
  if (!source) return fail('invalid', url, [`unknown source "${entry.sourceId}"`]);
  const problems = checkLayerConsistency(entry, source, collection.value);
  if (problems.length > 0) return fail('invalid', url, problems);

  return ok({ entry, source, collection: collection.value, status: layerStatus(collection.value) });
}

/** Loads a commune manifest and all its layers. Any invalid file fails the whole commune. */
export async function loadCommune(
  fetcher: Fetcher,
  manifestUrl: string,
): Promise<Result<CommuneData>> {
  const manifest = await fetchValidated(fetcher, manifestUrl, manifestSchema);
  if (!manifest.ok) return manifest;

  const results = await Promise.all(
    manifest.value.layers.map((entry) => loadLayer(fetcher, manifestUrl, manifest.value, entry)),
  );
  const layers: LoadedLayer[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    layers.push(result.value);
  }
  return ok({ manifest: manifest.value, layers });
}

/** Registry → default commune → manifest and layers. */
export async function loadDefaultCommune(
  fetcher: Fetcher,
  registryUrl: string,
): Promise<Result<CommuneData>> {
  const registry = await loadRegistry(fetcher, registryUrl);
  if (!registry.ok) return registry;
  const entry = registry.value.communes.find((c) => c.id === registry.value.defaultCommune);
  // Guaranteed by registrySchema; kept as a typed guard.
  if (!entry) return fail('invalid', registryUrl, ['default commune missing']);
  const manifestUrl = resolveSameOrigin(entry.manifest, registryUrl);
  if (!manifestUrl)
    return fail('invalid', entry.manifest, ['manifest path leaves the data origin']);
  return loadCommune(fetcher, manifestUrl);
}
