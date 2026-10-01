import type { LayerCollection, LayerEntry, Source } from './schema.ts';

export type LayerStatus = 'verified' | 'demo';

/**
 * Cross-checks a layer against the source its manifest entry points to. A feature may never
 * claim more than its source: same license, same verification flag, and a URL under the
 * source's URL. Returns human-readable problems (empty when consistent).
 */
export function checkLayerConsistency(
  entry: LayerEntry,
  source: Source,
  collection: LayerCollection,
): string[] {
  const problems: string[] = [];
  collection.features.forEach((feature, index) => {
    const meta = feature.properties;
    const where = `${entry.id} feature ${String(index)}`;
    if (meta.verified !== source.verified) {
      problems.push(
        `${where}: verified=${String(meta.verified)} but source "${source.id}" is ${String(source.verified)}`,
      );
    }
    if (meta.license !== source.license) {
      problems.push(`${where}: license differs from source "${source.id}"`);
    }
    if (!meta.sourceUrl.startsWith(source.url)) {
      problems.push(`${where}: sourceUrl is not under ${source.url}`);
    }
  });
  return problems;
}

/** A layer is shown as official only when every one of its features is verified. */
export function layerStatus(collection: LayerCollection): LayerStatus {
  return collection.features.every((feature) => feature.properties.verified) ? 'verified' : 'demo';
}
