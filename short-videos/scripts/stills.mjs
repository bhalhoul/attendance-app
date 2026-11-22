// لقطات ثابتة للمراجعة السريعة (بدون تصيير الفيديو كامل)
// npm run stills -- --variant A --frames 0,45,100,200,300,380,500 [--safe 1]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import { VARIANT_INFO } from '../shared/timing.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') && a.push([x.slice(2), arr[i + 1]]), a), []));
const id = args.id ?? 'ep001';
const variant = args.variant ?? 'A';
const frames = (args.frames ?? '0,45,100,200,300,380,500').split(',').map(Number);
const out = path.resolve(args.out ?? 'out/stills');
fs.mkdirSync(out, { recursive: true });
const challenge = JSON.parse(fs.readFileSync(`challenges/${id}.json`, 'utf8'));
const browserExecutable = process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER) ? process.env.REMOTION_BROWSER : null;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const inputProps = { challenge, variant, showSafeZones: 'safe' in args };
const composition = await selectComposition({ serveUrl, id: `${id}-${variant}-${VARIANT_INFO[variant].slug}`, inputProps, browserExecutable });
for (const f of frames) {
  const file = path.join(out, `${id}-${variant}-${String(f).padStart(3, '0')}${'safe' in args ? '-safe' : ''}.png`);
  await renderStill({ composition, serveUrl, frame: f, output: file, inputProps, browserExecutable, scale: Number(args.scale ?? 0.5) });
  console.log('✔', file);
}
