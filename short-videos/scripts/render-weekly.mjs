// تصيير "أخبار الأسبوع": npm run render:weekly -- --week 2026-W47 [--safe 1]
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') && a.push([x.slice(2), arr[i + 1]]), a), []));
const week = args.week; if (!week) { console.error('خاص --week (مثلاً 2026-W47)'); process.exit(1); }
const safe = 'safe' in args;
const weekly = JSON.parse(fs.readFileSync(path.join('weekly', `${week}.json`), 'utf8'));
for (const [i, s] of weekly.segments.entries()) if (!s.source) { console.error(`المقطع ${i + 1} ما عندوش مصدر`); process.exit(1); }

execFileSync('node', ['scripts/generate-weekly-audio.mjs', week], { stdio: 'inherit' });
execFileSync('node', ['scripts/index-challenges.mjs'], { stdio: 'inherit' });
const browserExecutable = process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER) ? process.env.REMOTION_BROWSER : null;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const inputProps = { weekly, showSafeZones: safe };
const composition = await selectComposition({ serveUrl, id: weekly.id, inputProps, browserExecutable });
fs.mkdirSync('out/.tmp', { recursive: true });
const raw = path.join('out/.tmp', `${weekly.id}.mov`);
let last = -1;
await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: raw, inputProps, browserExecutable, crf: 18,
  pixelFormat: 'yuv420p', imageFormat: 'png', audioCodec: 'pcm-16',
  onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(`${weekly.id}: ${p * 10}%`); } } });
const final = path.join('out', `${weekly.id}${safe ? '-safezones' : ''}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-c:v', 'copy',
  '-af', 'loudnorm=I=-14:TP=-2:LRA=11,aresample=48000,alimiter=limit=0.7:level=false', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
  '-movflags', '+faststart', '-metadata', `title=${weekly.brand} — ${weekly.rangeLabel}`, final]);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', '8', '-i', final, '-frames:v', '1', '-q:v', '2', final.replace('.mp4', '-cover.jpg')]);
fs.rmSync('out/.tmp', { recursive: true, force: true });
console.log('✔', final);
