// Checks that a deployed site serves exactly the security headers of vercel.json.
//
//   npm run check:headers                                  (https://evacua-phi.vercel.app)
//   node scripts/check-headers.ts https://example.vercel.app
//
// Exits with code 1 and lists the differences when a header is missing or has another value.
import { globalHeaders } from '../config/headers.ts';

const DEFAULT_URL = 'https://evacua-phi.vercel.app/';

async function main(): Promise<void> {
  const url = process.argv[2] ?? DEFAULT_URL;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${String(response.status)} for ${url}`);
  const expected = globalHeaders();
  const problems: string[] = [];
  for (const [name, value] of Object.entries(expected)) {
    const actual = response.headers.get(name);
    if (actual === null) problems.push(`missing: ${name}`);
    else if (actual !== value)
      problems.push(`different: ${name}\n  expected: ${value}\n  actual:   ${actual}`);
  }
  if (problems.length > 0) {
    console.error(`${url}\n${problems.join('\n')}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `${url}: all ${String(Object.keys(expected).length)} security headers match vercel.json`,
  );
}

await main();
