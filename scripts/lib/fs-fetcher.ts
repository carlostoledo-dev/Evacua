// Serves local files through the same `Fetcher` contract the app uses, so build-time
// validation runs exactly the runtime loading and validation code.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Fetcher } from '../../src/data/loader.ts';

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export const fsFetcher: Fetcher = async (url) => {
  try {
    return new Response(await readFile(fileURLToPath(url)));
  } catch (error) {
    if (isMissingFile(error)) return new Response(null, { status: 404 });
    throw error;
  }
};
