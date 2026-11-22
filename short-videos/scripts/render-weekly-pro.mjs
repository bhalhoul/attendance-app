// مونتاج "أخبار الأسبوع" الاحترافي: صوت ElevenLabs + رسوم متحركة + موسيقى كتنقص تحت الصوت
// npm run render:weekly-pro -- --week 2026-W47 [--tts 1] [--safe 1]
//  --tts 1 : يعاود يصاوب صوت المذيع من weekly/<week>.narration.json (كيستهلك حروف ElevenLabs)
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { BPM } from '../shared/timing.js';
import { mulberry32 } from '../shared/color.js';
import { makeMix, master, writeWav, hz, kick, hat, clap, bass, pluck, tick, pop, whoosh, riser, impact, ding } from '../shared/synth.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') && a.push([x.slice(2), arr[i + 1]]), a), []));
const week = args.week ?? '2026-W47';
const safe = 'safe' in args;
if ('tts' in args) execFileSync('node', ['scripts/tts-elevenlabs.mjs', `weekly/${week}.narration.json`], { stdio: 'inherit' });
execFileSync('node', ['scripts/build-weekly-timeline.mjs', week], { stdio: 'inherit' });
const tl = JSON.parse(fs.readFileSync(`weekly/${week}.timeline.json`, 'utf8'));
const tmp = path.join('out', '.pro'); fs.mkdirSync(tmp, { recursive: true });

// ---------- 1) الموسيقى والمؤثرات ----------
const D = tl.durationSec, B = 60 / BPM, r = mulberry32(4711);
const mix = makeMix(D);
const K = kick(), H = hat(), C = clap();
const ROOT = { intro: 55, summit: 49, mideast: 46.25, ai: 55, ceuta: 51.91, cop: 49, outro: 55 };
const partAt = (t) => tl.parts.find((p) => t >= p.sceneStart && t < p.sceneEnd) ?? tl.parts.at(-1);
const prog = [0, -4, 3, -5], scale = [0, 2, 3, 5, 7, 8, 11];
for (let b = 0; b * B < D; b++) {
  const t = b * B, inBar = b % 4;
  if (inBar === 0 || inBar === 2) mix.add(K, t, 0.7);
  if (inBar === 1 || inBar === 3) mix.add(C, t, 0.18);
  mix.add(H, t + B / 2, 0.14, -0.25);
}
for (let st = 0; st * (B / 2) < D; st++) {
  const t = st * (B / 2), root = ROOT[partAt(t).key], bar = Math.floor(t / (4 * B));
  mix.add(bass(hz(root, prog[bar % 4]) * (st % 4 === 3 ? 2 : 1), B / 2 - 0.03), t, 0.32);
  if (r() > 0.5) mix.add(pluck(hz(root, 36 + prog[bar % 4] + scale[[0, 2, 4, 2, 0, 4, 6, 4][st % 8]]), 0.45, 0.6), t, 0.08, 0.2);
}
mix.add(impact(), 0.05, 0.8);
for (const p of tl.parts.slice(1)) { mix.add(whoosh(0.6, true), p.sceneStart - 0.45, 0.42, 0.3); mix.add(impact(), p.sceneStart + 0.05, 0.28); }
for (const p of tl.parts) for (const [name, at] of Object.entries(p.cues)) {
  if (name === 'question') { mix.add(ding(), at, 0.28); continue; }
  if (['stat', 'amount', 'files', 'vote', 'clock', 'weak', 'tanker'].includes(name)) { mix.add(impact(), at, 0.2); mix.add(pop(), at, 0.3); continue; }
  mix.add(pop(), at, 0.22); mix.add(tick(), at + 0.02, 0.2);
}
mix.add(riser(1.4), tl.parts[1].sceneStart - 1.4, 0.3);
master(mix);
const musicWav = path.join(tmp, 'music.wav'); writeWav(musicWav, mix);

// ---------- 2) مسار صوت المذيع ----------
const voiceWav = path.join(tmp, 'voice.wav');
const vin = tl.parts.flatMap((p) => ['-i', path.join('public', p.audio)]);
const vdel = tl.parts.map((p, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(p.start * 1000)}:all=1[v${i}]`).join(';');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...vin, '-filter_complex',
  `${vdel};${tl.parts.map((_, i) => `[v${i}]`).join('')}amix=inputs=${tl.parts.length}:normalize=0,highpass=f=70,acompressor=threshold=-18dB:ratio=2.5:attack=8:release=150,apad=whole_dur=${D},atrim=0:${D}[v]`,
  '-map', '[v]', voiceWav]);

// ---------- 3) الصورة (Remotion، بلا صوت) ----------
execFileSync('node', ['scripts/index-challenges.mjs'], { stdio: 'inherit' });
const browserExecutable = process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER) ? process.env.REMOTION_BROWSER : null;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const inputProps = { timeline: tl, rangeLabel: '16 – 22 نونبر 2026', brand: 'أخبار الأسبوع', withAudio: false, showSafeZones: safe };
const composition = await selectComposition({ serveUrl, id: `weekly-pro-${week.toLowerCase()}`, inputProps, browserExecutable });
const rawVideo = path.join(tmp, 'video.mp4');
let last = -1;
await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: rawVideo, inputProps, browserExecutable, crf: 17, muted: true,
  pixelFormat: 'yuv420p', imageFormat: 'jpeg', jpegQuality: 95,
  onProgress: ({ progress }) => { const p = Math.floor(progress * 20); if (p !== last) { last = p; console.log(`video: ${p * 5}%`); } } });

// ---------- 4) الدمج: الموسيقى كتنقص تحت الصوت (sidechain) ----------
const final = path.join('out', `weekly-pro-${week.toLowerCase()}${safe ? '-safezones' : ''}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', rawVideo, '-i', musicWav, '-i', voiceWav, '-filter_complex',
  '[1:a]aresample=48000,volume=0.55[m];[2:a]asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=400[duck];' +
  '[duck][v2]amix=inputs=2:normalize=0:weights=1 1.6,loudnorm=I=-14:TP=-2:LRA=9,aresample=48000,alimiter=limit=0.7:level=false[a]',
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart',
  '-metadata', 'title=أهم أخبار الأسبوع — 16-22 نونبر 2026', final]);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', '9', '-i', final, '-frames:v', '1', '-q:v', '2', final.replace('.mp4', '-cover.jpg')]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('✔', final);
