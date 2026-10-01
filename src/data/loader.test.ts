import { describe, expect, it } from 'vitest';
import {
  BASE,
  communeFiles,
  fakeFetcher,
  manifest,
  meetingPoints,
  REGISTRY_URL,
  source,
} from './__fixtures__/commune.ts';
import { loadCommune, loadDefaultCommune, loadRegistry } from './loader.ts';

const MANIFEST_URL = `${BASE}alpha/manifest.json`;
const LAYER_URL = `${BASE}alpha/layers/meeting-points.geojson`;

describe('loadDefaultCommune', () => {
  it('loads the registry, the default manifest and its layers', async () => {
    const result = await loadDefaultCommune(fakeFetcher(communeFiles(['alpha'])), REGISTRY_URL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.manifest.id).toBe('alpha');
    expect(result.value.layers).toHaveLength(1);
    expect(result.value.layers[0]?.status).toBe('demo');
  });

  it('marks a layer as verified only when its source and features are verified', async () => {
    const files = communeFiles(['alpha']);
    files[MANIFEST_URL] = manifest('alpha', { sources: [source({ verified: true })] });
    files[LAYER_URL] = meetingPoints({ verified: true });
    const result = await loadDefaultCommune(fakeFetcher(files), REGISTRY_URL);
    expect(result.ok && result.value.layers[0]?.status).toBe('verified');
  });

  it('loads a second commune with zero code changes (data only)', async () => {
    const fetcher = fakeFetcher(communeFiles(['alpha', 'beta']));
    const registry = await loadRegistry(fetcher, REGISTRY_URL);
    expect(registry.ok && registry.value.communes.map((c) => c.id)).toEqual(['alpha', 'beta']);
    const beta = await loadCommune(fetcher, `${BASE}beta/manifest.json`);
    expect(beta.ok && beta.value.manifest.id).toBe('beta');
  });
});

describe('loadCommune failures are explicit, never thrown', () => {
  it('reports a network error when fetch rejects (e.g. offline without cache)', async () => {
    const files = communeFiles(['alpha']);
    files[MANIFEST_URL] = 'network-error';
    const result = await loadCommune(fakeFetcher(files), MANIFEST_URL);
    expect(!result.ok && result.error.kind).toBe('network');
  });

  it('reports not-found for a missing layer file', async () => {
    const files = Object.fromEntries(
      Object.entries(communeFiles(['alpha'])).filter(([url]) => url !== LAYER_URL),
    );
    const result = await loadCommune(fakeFetcher(files), MANIFEST_URL);
    expect(!result.ok && result.error).toMatchObject({ kind: 'not-found', resource: LAYER_URL });
  });

  it('reports a server error as a network problem with its status', async () => {
    const files = communeFiles(['alpha']);
    files[MANIFEST_URL] = 503;
    const result = await loadCommune(fakeFetcher(files), MANIFEST_URL);
    expect(!result.ok && result.error).toMatchObject({ kind: 'network', issues: ['HTTP 503'] });
  });

  it('reports invalid JSON', async () => {
    const files = communeFiles(['alpha']);
    files[LAYER_URL] = '{ not json';
    const result = await loadCommune(fakeFetcher(files), MANIFEST_URL);
    expect(!result.ok && result.error.kind).toBe('invalid');
  });

  it('rejects a layer whose features lack provenance, naming the field', async () => {
    const files = communeFiles(['alpha']);
    files[LAYER_URL] = meetingPoints({ license: undefined });
    const result = await loadCommune(fakeFetcher(files), MANIFEST_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('invalid');
    expect(result.error.issues.join(' ')).toContain('license');
  });

  it('rejects features that claim verification their source does not have', async () => {
    const files = communeFiles(['alpha']);
    files[LAYER_URL] = meetingPoints({ verified: true });
    const result = await loadCommune(fakeFetcher(files), MANIFEST_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.issues.join(' ')).toContain('verified=true');
  });

  it('rejects features whose URL is not under their source', async () => {
    const files = communeFiles(['alpha']);
    files[LAYER_URL] = meetingPoints({ sourceUrl: 'https://elsewhere.example/points' });
    const result = await loadCommune(fakeFetcher(files), MANIFEST_URL);
    expect(!result.ok && result.error.issues.join(' ')).toContain('sourceUrl');
  });

  it('rejects an invalid registry', async () => {
    const result = await loadDefaultCommune(
      fakeFetcher({ [REGISTRY_URL]: { communes: 'x' } }),
      REGISTRY_URL,
    );
    expect(!result.ok && result.error.kind).toBe('invalid');
  });
});
