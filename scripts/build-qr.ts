// QR code that opens the public demo on a phone, shown next to the phone frame on computers.
//
//   npm run qr   → public/qr-demo.svg (commit the output)
//
// Generated once at build time with `qrcode` (MIT, dev-only); nothing is fetched at runtime.
import { writeFile } from 'node:fs/promises';
import QRCode from 'qrcode';
import { PUBLIC_URL } from '../src/app/publicUrl.ts';

const OUT = 'public/qr-demo.svg';

const svg = await QRCode.toString(PUBLIC_URL, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#0a1a3f', light: '#ffffff' },
});
await writeFile(OUT, svg);
console.log(`${OUT} → ${PUBLIC_URL}`);
