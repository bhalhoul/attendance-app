// استوديو الأخبار — أمر واحد لكل فيديو:
//   npm run studio:make -- studio/episodes/2026-11-22-top.json          → out/studio/<id>.mp4
//   npm run studio:make -- studio/episodes/*.json                       → كلهم
//   زيد --stills 0.25  : لقطات مراجعة كل 1.5 ث (بلا تصيير الفيديو)
//   زيد --safe 1       : يرسم مناطق أزرار TikTok/Instagram
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { BPM } from '../shared/timing.js';
import { mulberry32 } from '../shared/color.js';
import { makeMix, master, writeWav, hz, kick, hat, clap, bass, pluck, tick, pop, whoosh, riser, impact, ding } from '../shared/synth.js';

const argv = process.argv.slice(2);
const files = argv.filter((a) => a.endsWith('.json'));
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const stills = opt('stills'), safe = argv.includes('--safe');
const browserExecutable = process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER) ? process.env.REMOTION_BROWSER : null;
fs.mkdirSync('out/studio', { recursive: true });

// 1) الصوت + الخطوط الزمنية
for (const f of files) execFileSync('node', ['scripts/studio-build.mjs', f], { stdio: 'inherit' });
execFileSync('node', ['scripts/index-challenges.mjs'], { stdio: 'ignore' });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });

for (const f of files) {
  const ep = JSON.parse(fs.readFileSync(f, 'utf8'));
  const tl = JSON.parse(fs.readFileSync(`studio/build/${ep.id}.timeline.json`, 'utf8'));
  const inputProps = { tl, withAudio: false, showSafeZones: safe };
  const composition = await selectComposition({ serveUrl, id: `studio-${tl.id}`, inputProps, browserExecutable });
  if (argv.includes('--covers')) {
    for (const [ci, spec] of (ep.covers ?? []).entries()) {
      const cp = { spec, brand: tl.brand };
      const cc = await selectComposition({ serveUrl, id: 'studio-cover', inputProps: cp, browserExecutable });
      const out = path.resolve('out', 'studio', `${tl.id}-cover${ep.covers.length > 1 ? '-' + 'ABCD'[ci] : ''}.jpg`);
      await renderStill({ composition: cc, serveUrl, frame: 0, inputProps: cp, browserExecutable, imageFormat: 'jpeg', jpegQuality: 92, output: out });
      console.log('✔ cover', out);
    }
    continue;
  }
  if (stills) {
    const dir = path.join('out', 'studio', 'stills', tl.id); fs.mkdirSync(dir, { recursive: true });
    for (let s = 0.6; s < tl.durationSec; s += 1.5)
      await renderStill({ composition, serveUrl, frame: Math.round(s * 30), output: path.join(dir, `${String(Math.round(s * 10)).padStart(5, '0')}.png`), inputProps, browserExecutable, scale: Number(stills) });
    console.log('✔ stills', dir); continue;
  }
  const tmp = path.join('out', '.studio-' + tl.id); fs.mkdirSync(tmp, { recursive: true });

  // 2) موسيقى + مؤثرات (حسب الشكل)
  const D = tl.durationSec, B = 60 / BPM, r = mulberry32(tl.id.length * 7919);
  const mix = makeMix(D);
  const K = kick(), H = hat(), C = clap();
  const urgent = tl.format === 'quick';
  const root = { top: 46.25, minute: 55, quick: 49 }[tl.format] ?? 55;
  const prog = [0, -4, 3, -5], scale = [0, 2, 3, 5, 7, 8, 11];
  for (let b = 0; b * B < D; b++) {
    const t = b * B, inBar = b % 4;
    if (inBar === 0 || inBar === 2 || (urgent && inBar === 3)) mix.add(K, t, 0.7);
    if (inBar === 1 || inBar === 3) mix.add(C, t, 0.18);
    for (const s of urgent ? [0.25, 0.5, 0.75] : [0.5]) mix.add(H, t + s * B, 0.13, -0.25);
  }
  for (let st = 0; st * (B / 2) < D; st++) {
    const t = st * (B / 2), bar = Math.floor(t / (4 * B));
    mix.add(bass(hz(root, prog[bar % 4]) * (st % 4 === 3 ? 2 : 1), B / 2 - 0.03), t, 0.32);
    if (r() > 0.5) mix.add(pluck(hz(root, 36 + prog[bar % 4] + scale[[0, 2, 4, 2, 0, 4, 6, 4][st % 8]]), 0.45, 0.6), t, 0.08, 0.2);
  }
  mix.add(impact(), 0.05, 0.7);
  if (urgent) [0.05, 0.2, 0.35].forEach((d) => mix.add(tick(), d, 0.6));
  for (const p of tl.parts.slice(1)) { mix.add(whoosh(0.6, true), p.sceneStart - 0.45, 0.42, 0.3); mix.add(impact(), p.sceneStart + 0.05, 0.28); }
  for (const p of tl.parts) {
    for (const v of p.visuals) if (v.at > p.start + 0.2) { mix.add(pop(), v.at, 0.25); mix.add(tick(), v.at + 0.02, 0.18); }
    for (const h of p.heads) if (h.stat) { mix.add(impact(), h.at, 0.2); mix.add(pop(), h.at, 0.3); }
  }
  mix.add(ding(), D - 2.2, 0.35);
  const rv = tl.parts.find((p) => p.key === 'reveal');
  if (rv) { mix.add(riser(2.2), rv.sceneStart - 2.2, 0.45); mix.add(impact(), rv.start, 0.5); mix.add(ding(), rv.start + 0.1, 0.4); }
  if (tl.format === 'trend') { mix.add(impact(), 0.02, 0.9); mix.add(whoosh(0.4, false), 0, 0.5); }
  if (tl.parts[1]) mix.add(riser(1.2), tl.parts[1].sceneStart - 1.2, 0.25);
  master(mix);
  const musicWav = path.join(tmp, 'music.wav'); writeWav(musicWav, mix);

  // 3) صوت المذيع ف بلاصتو
  const voiceWav = path.join(tmp, 'voice.wav');
  const vin = tl.parts.flatMap((p) => ['-i', path.join('public', p.audio)]);
  const vdel = tl.parts.map((p, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(p.start * 1000)}:all=1[v${i}]`).join(';');
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...vin, '-filter_complex',
    `${vdel};${tl.parts.map((_, i) => `[v${i}]`).join('')}amix=inputs=${tl.parts.length}:normalize=0,highpass=f=70,acompressor=threshold=-18dB:ratio=2.5:attack=8:release=150,apad=whole_dur=${D},atrim=0:${D}[v]`,
    '-map', '[v]', voiceWav]);

  // 4) الصورة
  const rawVideo = path.join(tmp, 'video.mp4');
  let last = -1;
  await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: rawVideo, inputProps, browserExecutable, crf: 17, muted: true,
    pixelFormat: 'yuv420p', imageFormat: 'jpeg', jpegQuality: 95,
    onProgress: ({ progress }) => { const q = Math.floor(progress * 4); if (q !== last) { last = q; console.log(`${tl.id}: ${q * 25}%`); } } });

  // 5) الدمج: الموسيقى كتنقص تحت الصوت + −14 LUFS
  const final = path.join('out', 'studio', `${tl.id}${safe ? '-safezones' : ''}.mp4`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', rawVideo, '-i', musicWav, '-i', voiceWav, '-filter_complex',
    '[1:a]aresample=48000,volume=0.55[m];[2:a]asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=400[duck];' +
    '[duck][v2]amix=inputs=2:normalize=0:weights=1 1.6,loudnorm=I=-14:TP=-2:LRA=9,aresample=48000,alimiter=limit=0.7:level=false[a]',
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart',
    '-metadata', `title=${tl.brand.name} — ${tl.brand.formats[tl.format].label} — ${tl.dateLabel}`, '-metadata', `artist=${tl.brand.name} ${tl.brand.handle}`, final]);
  if (ep.covers?.length) {
    for (const [ci, spec] of ep.covers.entries()) {
      const cp = { spec, brand: tl.brand };
      const cc = await selectComposition({ serveUrl, id: 'studio-cover', inputProps: cp, browserExecutable });
      await renderStill({ composition: cc, serveUrl, frame: 0, inputProps: cp, browserExecutable, imageFormat: 'jpeg', jpegQuality: 92,
        output: path.resolve(final.replace('.mp4', `-cover${ep.covers.length > 1 ? '-' + 'ABCD'[ci] : ''}.jpg`)) });
    }
  } else execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', '2', '-i', final, '-frames:v', '1', '-q:v', '2', final.replace('.mp4', '-cover.jpg')]);
  // وصف المنشور مع المصادر
  const desc = [`${tl.brand.formats[tl.format].icon} ${tl.brand.formats[tl.format].label} | ${tl.dateLabel}`, '',
    ...tl.parts.filter((p) => p.tag).map((p) => `• ${p.heads.find((h) => h.chip)?.chip ?? p.text.split(/[.،]/)[0]}`), '',
    '👇 شاركنا رأيك في التعليقات', `تابع ${tl.brand.name} ${tl.brand.handle}`, '',
    `📰 المصادر: ${(ep.sources ?? []).join('، ')}`, '🎙️ تعليق صوتي مولّد بالذكاء الاصطناعي (ElevenLabs)', '',
    '#أخبار #بالمختصر #المغرب #أخبار_اليوم'].join('\n');
  fs.writeFileSync(final.replace('.mp4', '.txt'), desc);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('✔', final);
}
