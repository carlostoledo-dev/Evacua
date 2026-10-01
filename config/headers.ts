// Single source of truth for HTTP security headers: vercel.json.
// `vite preview` (local + Playwright) reuses the same values so tests exercise the real policy.
import vercelConfig from '../vercel.json' with { type: 'json' };

const GLOBAL_SOURCE = '/(.*)';

export function globalHeaders(): Record<string, string> {
  const rule = vercelConfig.headers.find((entry) => entry.source === GLOBAL_SOURCE);
  if (!rule) {
    throw new Error(`vercel.json has no header rule for "${GLOBAL_SOURCE}"`);
  }
  return Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]));
}

/** Parses a CSP string into a directive → sources map. */
export function parseCsp(policy: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const part of policy.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) directives.set(name.toLowerCase(), sources);
  }
  return directives;
}
