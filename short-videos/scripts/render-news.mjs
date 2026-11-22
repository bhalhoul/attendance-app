// تصيير نشرة الأخبار: npm run render:news -- --date 2026-11-22 [--safe 1]
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') && a.push([x.slice(2), arr[i + 1]]), a), []));
const date = args.date ?? new Date().toISOString().slice(0, 10);
const safe = 'safe' in args;
const news = JSON.parse(fs.readFileSync(path.join('news', `${date}.json`), 'utf8'));
if (!news.items?.length || news.items.length > 6) { console.error('خاص بين 1 و 6 ديال الأخبار'); process.exit(1); }
for (const [i, it] of news.items.entries()) if (!it.source) { console.error(`الخبر ${i + 1} ما عندوش مصدر`); process.exit(1); }

execFileSync('node', ['scripts/generate-news-audio.mjs', date], { stdio: 'inherit' });
execFileSync('node', ['scripts/index-challenges.mjs'], { stdio: 'inherit' });
const browserExecutable = process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER) ? process.env.REMOTION_BROWSER : null;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const inputProps = { news, showSafeZones: safe };
const composition = await selectComposition({ serveUrl, id: news.id, inputProps, browserExecutable });
fs.mkdirSync('out/.tmp', { recursive: true });
const raw = path.join('out/.tmp', `${news.id}.mov`);
let last = -1;
await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: raw, inputProps, browserExecutable, crf: 16,
  pixelFormat: 'yuv420p', imageFormat: 'png', audioCodec: 'pcm-16',
  onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(`${news.id}: ${p * 10}%`); } } });
const final = path.join('out', `${news.id}${safe ? '-safezones' : ''}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-c:v', 'copy',
  '-af', 'loudnorm=I=-14:TP=-2:LRA=11,aresample=48000,alimiter=limit=0.7:level=false', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
  '-movflags', '+faststart', '-metadata', `title=${news.brand} — ${news.dateLabel}`, final]);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', '6', '-i', final, '-frames:v', '1', '-q:v', '2', final.replace('.mp4', '-cover.jpg')]);
fs.rmSync('out/.tmp', { recursive: true, force: true });
console.log('✔', final);
