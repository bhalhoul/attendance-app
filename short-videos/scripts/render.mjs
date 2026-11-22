// تصيير الفيديوهات: Remotion (الصورة + الصوت) ← FFmpeg (توحيد الصوت -14 LUFS، faststart، مقارنة).
// npm run render                 → كل النسخ A/B/C + فيديو المقارنة
// npm run render -- --variant A  → نسخة وحدة
// npm run render -- --id ep002
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { VARIANTS, VARIANT_INFO } from '../shared/timing.js';
import { validateChallenge } from '../shared/challenge.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') && a.push([x.slice(2), arr[i + 1]]), a), []));
const id = args.id ?? 'ep001';
const variants = args.variant ? [args.variant] : VARIANTS;
const safe = 'safe' in args; // --safe 1 : يرسم مناطق الواجهة (للمراجعة)
const root = process.cwd();
const outDir = path.join(root, 'out');
const tmpDir = path.join(outDir, '.tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const challenge = JSON.parse(fs.readFileSync(path.join(root, 'challenges', `${id}.json`), 'utf8'));
const v = validateChallenge(challenge);
if (!v.ok) { console.error('✘ التحدي ما دازش التحقق:\n' + v.errors.join('\n')); process.exit(1); }
console.log(`✔ ${id}: الجواب ${challenge.answer} — ΔE2000 ${v.deltaE.toFixed(2)}`);

execFileSync('node', ['scripts/generate-audio.mjs', id], { stdio: 'inherit' });

const browserExecutable = process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER) ? process.env.REMOTION_BROWSER : null;
console.log('… bundling');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts') });

const finals = [];
for (const variant of variants) {
  const compId = `${id}-${variant}-${VARIANT_INFO[variant].slug}`;
  const inputProps = { challenge, variant, showSafeZones: safe };
  const composition = await selectComposition({ serveUrl, id: compId, inputProps, browserExecutable });
  const raw = path.join(tmpDir, `${compId}${safe ? '-safe' : ''}.mov`);
  let last = -1;
  await renderMedia({
    composition, serveUrl, codec: 'h264', outputLocation: raw, inputProps, browserExecutable,
    crf: 16, pixelFormat: 'yuv420p', imageFormat: 'png', audioCodec: 'pcm-16', concurrency: args.concurrency ? Number(args.concurrency) : null,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; process.stdout.write(`\r${compId}: ${p * 10}%`); } },
  });
  process.stdout.write('\n');
  // FFmpeg: صوت AAC موحّد على -14 LUFS (معيار TikTok/Reels) + moov فالبداية للتشغيل السريع
  const final = path.join(outDir, `${compId}${safe ? '-safezones' : ''}.mp4`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw,
    '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-2:LRA=11,aresample=48000,alimiter=limit=0.79:level=false', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-metadata', `title=${challenge.texts.title}`, '-metadata', `comment=answer=${challenge.answer}`, final]);
  // صورة غلاف من الهوك
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', '2.4', '-i', final, '-frames:v', '1', '-q:v', '2',
    path.join(outDir, `${compId}${safe ? '-safezones' : ''}-cover.jpg`)]);
  finals.push({ variant, file: final });
  console.log('✔', path.relative(root, final));
}

// فيديو المقارنة: الثلاث نسخ جنب بعض (540×960 لكل وحدة) مع صوت النسخة A
if (finals.length === 3 && !safe) {
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const label = (i, name) => fs.existsSync(font)
    ? `,drawtext=fontfile=${font}:text='${name}':x=(w-tw)/2:y=20:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=12`
    : '';
  const filter = finals.map((f, i) => `[${i}:v]scale=540:960${label(i, VARIANT_INFO[f.variant].slug.toUpperCase() + ' (' + f.variant + ')')}[v${i}]`).join(';')
    + ';[v0][v1][v2]hstack=inputs=3[v]';
  const cmp = path.join(outDir, `${id}-comparison.mp4`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...finals.flatMap((f) => ['-i', f.file]),
    '-filter_complex', filter, '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-movflags', '+faststart', cmp]);
  console.log('✔', path.relative(root, cmp));
}
fs.rmSync(tmpDir, { recursive: true, force: true });
