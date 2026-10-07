// Imported first by main.tsx, before any module defines a schema: zod 4 decides at schema
// creation whether to compile fast parsers with `new Function`. Our CSP forbids eval (no
// 'unsafe-eval'), and even zod's caught probe is reported as a CSP violation. Plain parsing is
// fast enough for this app's data.
import { z } from 'zod';

z.config({ jitless: true });
