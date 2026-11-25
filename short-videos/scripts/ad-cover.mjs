// كوفر إعلان QRVE — node scripts/ad-cover.mjs
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import QRCode from 'qrcode';
const q = QRCode.create('https://qrve.click', { errorCorrectionLevel: 'M' });
const qr = { size: q.modules.size, data: Array.from(q.modules.data) };
const be = process.env.REMOTION_BROWSER;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
for (const [lang, id] of [['ar', 'darija'], ['es', 'es']]) {
  const inputProps = { lang, qr };
  const composition = await selectComposition({ serveUrl, id: 'qrve-cover', inputProps, browserExecutable: be });
  const out = path.resolve('out', 'ads', `qrve-ad-${id}-cover.jpg`);
  await renderStill({ composition, serveUrl, frame: 0, inputProps, browserExecutable: be, imageFormat: 'jpeg', jpegQuality: 93, output: out });
  console.log('✔', out);
}
