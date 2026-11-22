// لقطات مراجعة للمونتاج الاحترافي: node scripts/stills-pro.mjs <out> <ثواني مفصولة بفاصلة> [safe]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs'; import path from 'node:path';
const [,, out, secs, safe] = process.argv;
const timeline = JSON.parse(fs.readFileSync('weekly/2026-W47.timeline.json', 'utf8'));
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const inputProps = { timeline, rangeLabel: '16 – 22 نونبر 2026', brand: 'أخبار الأسبوع', withAudio: false, showSafeZones: safe === '1' };
const browserExecutable = process.env.REMOTION_BROWSER || null;
const composition = await selectComposition({ serveUrl, id: 'weekly-pro-2026-w47', inputProps, browserExecutable });
fs.mkdirSync(out, { recursive: true });
for (const s of secs.split(',').map(Number)) await renderStill({ composition, serveUrl, frame: Math.round(s * 30), output: path.join(out, `${String(Math.round(s * 10)).padStart(5, '0')}.png`), inputProps, browserExecutable, scale: 0.5 });
console.log('done');
