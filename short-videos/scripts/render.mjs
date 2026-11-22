// تصيير الفيديوهات: Remotion (الصورة + الصوت) ← FFmpeg (توحيد الصوت -14 LUFS، faststart، مقارنة).
// npm run render -- --id ep001              → النسخ الثلاث A/B/C + فيديو المقارنة
// npm run render -- --id ep002 --variant C  → نسخة وحدة
// npm run render -- --all                   → كل الحلقات، كل وحدة بالنسخة ديالها (variant ف JSON)
// زيد --safe 1 باش ترسم مناطق أزرار TikTok/Instagram (للمراجعة)
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { VARIANTS, VARIANT_INFO } from '../shared/timing.js';
import { validateChallenge } from '../shared/challenge.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') && a.push([x.slice(2), arr[i + 1]]), a), []));
const safe = 'safe' in args;
const root = process.cwd();
const outDir = path.join(root, 'out');
const tmpDir = path.join(outDir, '.tmp');
fs.mkdirSync(tmpDir, { recursive: true });
const load = (id) => JSON.parse(fs.readFileSync(path.join(root, 'challenges', `${id}.json`), 'utf8'));

// لائحة المهام [{ id, variant }]
let jobs;
if ('all' in args) {
  jobs = fs.readdirSync('challenges').filter((f) => f.endsWith('.json')).sort()
    .map((f) => { const c = JSON.parse(fs.readFileSync(path.join('challenges', f), 'utf8')); return { id: c.id, variant: c.variant ?? 'A' }; });
  if (args.skip) jobs = jobs.filter((j) => !args.skip.split(',').includes(j.id));
} else {
  const id = args.id ?? 'ep001';
  jobs = (args.variant ? [args.variant] : VARIANTS).map((variant) => ({ id, variant }));
}

for (const id of new Set(jobs.map((j) => j.id))) {
  const v = validateChallenge(load(id));
  if (!v.ok) { console.error(`✘ ${id} ما دازش التحقق:\n` + v.errors.join('\n')); process.exit(1); }
  console.log(`✔ ${id}: الجواب ${load(id).answer}`);
  execFileSync('node', ['scripts/generate-audio.mjs', id, jobs.filter((j) => j.id === id).map((j) => j.variant).join(',')], { stdio: 'inherit' });
}
execFileSync('node', ['scripts/index-challenges.mjs'], { stdio: 'inherit' });

const browserExecutable = process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER) ? process.env.REMOTION_BROWSER : null;
console.log('… bundling');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts') });

const finals = [];
for (const { id, variant } of jobs) {
  const challenge = load(id);
  const compId = `${id}-${variant}-${VARIANT_INFO[variant].slug}`;
  const inputProps = { challenge, variant, showSafeZones: safe };
  const composition = await selectComposition({ serveUrl, id: compId, inputProps, browserExecutable });
  const raw = path.join(tmpDir, `${compId}${safe ? '-safe' : ''}.mov`);
  let last = -1;
  await renderMedia({
    composition, serveUrl, codec: 'h264', outputLocation: raw, inputProps, browserExecutable,
    crf: 16, pixelFormat: 'yuv420p', imageFormat: 'png', audioCodec: 'pcm-16', concurrency: args.concurrency ? Number(args.concurrency) : null,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(`${compId}: ${p * 10}%`); } },
  });
  // FFmpeg: صوت AAC موحّد على -14 LUFS (معيار TikTok/Reels) + limiter + moov فالبداية للتشغيل السريع
  const final = path.join(outDir, `${compId}${safe ? '-safezones' : ''}.mp4`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw,
    '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-2:LRA=11,aresample=48000,alimiter=limit=0.7:level=false', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-metadata', `title=${challenge.texts.title}`, '-metadata', `comment=answer=${challenge.answer}`, final]);
  // صورة غلاف من الهوك
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', '3.4', '-i', final, '-frames:v', '1', '-q:v', '2',
    path.join(outDir, `${compId}${safe ? '-safezones' : ''}-cover.jpg`)]);
  fs.rmSync(raw, { force: true });
  finals.push({ id, variant, file: final });
  console.log('✔', path.relative(root, final));
}

// فيديو المقارنة: إلا تصيّرو الثلاث نسخ ديال نفس الحلقة
const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
for (const id of new Set(finals.map((f) => f.id))) {
  const set = finals.filter((f) => f.id === id);
  if (set.length !== 3 || safe) continue;
  const label = (name) => fs.existsSync(font)
    ? `,drawtext=fontfile=${font}:text='${name}':x=(w-tw)/2:y=20:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=12` : '';
  const filter = set.map((f, i) => `[${i}:v]scale=540:960${label(VARIANT_INFO[f.variant].slug.toUpperCase() + ' (' + f.variant + ')')}[v${i}]`).join(';')
    + ';[v0][v1][v2]hstack=inputs=3[v]';
  const cmp = path.join(outDir, `${id}-comparison.mp4`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...set.flatMap((f) => ['-i', f.file]),
    '-filter_complex', filter, '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-movflags', '+faststart', cmp]);
  console.log('✔', path.relative(root, cmp));
}
fs.rmSync(tmpDir, { recursive: true, force: true });
