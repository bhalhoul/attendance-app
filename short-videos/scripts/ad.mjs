// إعلانات QRVE — node scripts/ad.mjs ads/qrve/qrve-ad-darija.json [--stills 0.25]
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { mulberry32 } from '../shared/color.js';
import { makeMix, master, writeWav, hz, kick, hat, clap, bass, pluck, pop, whoosh, riser, impact, ding, tick } from '../shared/synth.js';

const argv = process.argv.slice(2);
const files = argv.filter((a) => a.endsWith('.json'));
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const stills = opt('stills');
const browserExecutable = process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER) ? process.env.REMOTION_BROWSER : null;
fs.mkdirSync('out/ads', { recursive: true });
const q = QRCode.create('https://qrve.click', { errorCorrectionLevel: 'M' });
const qr = { size: q.modules.size, data: Array.from(q.modules.data) };
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });

for (const f of files) {
  execFileSync('node', ['scripts/studio-build.mjs', f], { stdio: 'inherit' });
  const ep = JSON.parse(fs.readFileSync(f, 'utf8'));
  const tl = { ...JSON.parse(fs.readFileSync(`ads/build/${ep.id}.timeline.json`, 'utf8')), qr };
  const inputProps = { tl, withAudio: false };
  const composition = await selectComposition({ serveUrl, id: 'qrve-ad', inputProps, browserExecutable });
  if (stills) {
    const dir = path.join('out', 'ads', 'stills', tl.id); fs.mkdirSync(dir, { recursive: true });
    for (let s = 0.3; s < tl.durationSec; s += 1.2)
      await renderStill({ composition, serveUrl, frame: Math.round(s * 30), output: path.join(dir, `${String(Math.round(s * 10)).padStart(5, '0')}.png`), inputProps, browserExecutable, scale: Number(stills) });
    console.log('✔ stills', dir); continue;
  }
  const tmp = path.join('out', '.ad-' + tl.id); fs.mkdirSync(tmp, { recursive: true });
  // موسيقى إعلان: إيقاع خفيف ومتفائل (118 BPM) + مؤثرات على الأحداث
  const D = tl.durationSec, B = 60 / 118, r = mulberry32(7);
  const mix = makeMix(D); const K = kick(), H = hat(), C = clap();
  const root = 52, prog = [0, 5, -3, -5], scale = [0, 2, 4, 7, 9, 12];
  for (let b = 0; b * B < D; b++) {
    const t = b * B, i = b % 4;
    if (i === 0 || i === 2) mix.add(K, t, 0.6);
    if (i === 1 || i === 3) mix.add(C, t, 0.16);
    mix.add(H, t + 0.5 * B, 0.12, -0.25);
  }
  for (let st = 0; st * (B / 2) < D; st++) {
    const t = st * (B / 2), bar = Math.floor(t / (4 * B));
    mix.add(bass(hz(root, prog[bar % 4]) * (st % 4 === 3 ? 2 : 1), B / 2 - 0.03), t, 0.26);
    if (r() > 0.35) mix.add(pluck(hz(root, 36 + prog[bar % 4] + scale[[0, 2, 4, 3, 1, 4, 5, 2][st % 8]]), 0.4, 0.6), t, 0.09, 0.25);
  }
  mix.add(impact(), 0.03, 0.6);
  for (const p of tl.parts.slice(1)) mix.add(whoosh(0.5, true), p.sceneStart - 0.35, 0.35, 0.3);
  for (const p of tl.parts) for (const [k, v] of Object.entries(p.cues ?? {})) {
    if (k === 'scanAt') { mix.add(riser(0.9), v, 0.25); mix.add(ding(), v + 0.95, 0.45); }
    else if (k === 'openAt') mix.add(pop(), v, 0.35);
    else { mix.add(pop(), v, 0.25); mix.add(tick(), v + 0.02, 0.15); }
  }
  const pr = tl.parts.find((p) => p.key === 'price'); if (pr) { mix.add(impact(), pr.sceneStart + 0.2, 0.45); mix.add(ding(), pr.sceneStart + 1.0, 0.4); }
  mix.add(ding(), D - 1.6, 0.3);
  master(mix);
  const musicWav = path.join(tmp, 'music.wav'); writeWav(musicWav, mix);
  const voiceWav = path.join(tmp, 'voice.wav');
  const vp = tl.parts.filter((p) => p.audio).map((p) => (tl.voiceFull ? { ...p, start: 0.15 } : p));
  const vin = vp.flatMap((p) => ['-i', path.join('public', p.audio)]);
  const vdel = vp.map((p, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(p.start * 1000)}:all=1[v${i}]`).join(';');
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...vin, '-filter_complex',
    `${vdel};${vp.map((_, i) => `[v${i}]`).join('')}amix=inputs=${vp.length}:normalize=0,highpass=f=70,acompressor=threshold=-18dB:ratio=2.5:attack=8:release=150,apad=whole_dur=${D},atrim=0:${D}[v]`, '-map', '[v]', voiceWav]);
  const rawVideo = path.join(tmp, 'video.mp4'); let last = -1;
  await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: rawVideo, inputProps, browserExecutable, crf: 17, muted: true, pixelFormat: 'yuv420p', imageFormat: 'jpeg', jpegQuality: 95,
    onProgress: ({ progress }) => { const k = Math.floor(progress * 4); if (k !== last) { last = k; console.log(`${tl.id}: ${k * 25}%`); } } });
  const final = path.join('out', 'ads', `${tl.id}.mp4`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', rawVideo, '-i', musicWav, '-i', voiceWav, '-filter_complex',
    '[1:a]aresample=48000,volume=0.6[m];[2:a]asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=400[duck];' +
    '[duck][v2]amix=inputs=2:normalize=0:weights=1 1.6,loudnorm=I=-14:TP=-2:LRA=9,aresample=48000,alimiter=limit=0.7:level=false[a]',
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-metadata', 'title=QRVE — qrve.click', final]);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(tl.parts.find((p) => p.key === 'price').sceneStart + 1.6), '-i', final, '-frames:v', '1', '-q:v', '2', final.replace('.mp4', '-cover.jpg')]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('✔', final);
}
