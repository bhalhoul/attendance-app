// توليد الموسيقى والمؤثرات برمجياً (بدون أي ملف خارجي → بدون مشاكل حقوق).
// الإيقاع 120 BPM، مقام حجاز خفيف، دربوكة (دوم/تك) + باص + نقر وتري (Karplus-Strong).
// الخرج: public/audio/<id>-<variant>.wav
import fs from 'node:fs';
import path from 'node:path';
import { DURATION_SECONDS, BPM, SECTIONS, FPS, HOOK_CUES, VARIANTS, beatSec, countdownFrame, COUNTDOWN_FROM } from '../shared/timing.js';
import { mulberry32 } from '../shared/color.js';

import { SR, makeMix, master, writeWav, hz, kick, doum, tek, hat, clap, bass, pluck, tick, beep, pop, whoosh, riser, impact, ding, sparkle, glitch } from '../shared/synth.js';

const B = 60 / BPM; // ثانية لكل ضربة
const fsec = (frame) => frame / FPS;
// ---------- موسيقى خاصة بكل حلقة (مقام + نغمة أساس + لحن + إيقاع) حسب seed ----------
const SCALES = {
  hijaz: [0, 1, 4, 5, 7, 8, 10],
  nahawand: [0, 2, 3, 5, 7, 8, 11],
  kurd: [0, 1, 3, 5, 7, 8, 10],
  ajam: [0, 2, 4, 5, 7, 9, 11],
};
const ROOTS = { A: 55, D: 73.42, E: 41.2, G: 49, C: 65.41 }; // تردد الباص (أوكتاف 1)

function musicFor(seed, override = {}) {
  const r = mulberry32(seed * 31 + 7);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const scaleName = override.scale ?? pick(Object.keys(SCALES));
  const scale = SCALES[scaleName];
  const rootName = override.root ?? pick(Object.keys(ROOTS));
  const root = ROOTS[rootName];
  // تسلسل الباص (درجات المقام) — 4 ميزورات كتعاود
  const prog = [0, pick([0, 5]), pick([1, 3, 6]), pick([4, 6, 0])].map((d) => scale[d] - (scale[d] > 7 ? 12 : 0));
  // لحن 16 خطوة بحركة متدرجة
  let deg = 0;
  const motif = Array.from({ length: 16 }, (_, i) => {
    if (i % 4 === 3 || (i > 0 && r() < 0.25)) return null;
    deg = Math.max(0, Math.min(9, deg + pick([-1, 1, 1, 2, -2, 0])));
    return 36 + scale[deg % 7] + 12 * Math.floor(deg / 7); // نصف تونات فوق الباص (3 أوكتافات)
  });
  motif[0] = 36;
  return { scaleName, rootName, root, prog, motif, groove: Math.floor(r() * 3), bright: 0.45 + r() * 0.2 };
}

function intensityAt(t) {
  const s = (f) => fsec(f);
  if (t < s(SECTIONS.countdown.from)) return 'full';
  if (t < s(SECTIONS.comment.from)) return 'tense';
  if (t < s(SECTIONS.reveal.from) - B / 2) return 'groove';
  if (t < s(SECTIONS.reveal.from)) return 'gap';
  return 'full';
}

function buildMusic(mix, M) {
  const K = kick(), D = doum(), T = tek(), H = hat(), C = clap();
  const totalBeats = Math.floor(DURATION_SECONDS / B);
  for (let b = 0; b < totalBeats; b++) {
    for (const sub of [0, 0.5]) {
      const t = (b + sub) * B; const mode = intensityAt(t);
      if (mode === 'gap') continue;
      const inBar = b % 4;
      if (mode === 'full' || mode === 'groove') {
        const kickHit = M.groove === 1 ? sub === 0 && inBar !== 3 : M.groove === 2 ? (sub === 0 && inBar === 0) || (sub === 0.5 && inBar === 2) : sub === 0 && (inBar === 0 || inBar === 2);
        if (kickHit) mix.add(K, t, 0.9);
        if (sub === 0.5 && inBar === 1) mix.add(D, t, 0.6, -0.2); // دوم
        if (sub === 0 && (inBar === 1 || inBar === 3)) mix.add(C, t, 0.45);
        mix.add(T, t, sub ? 0.35 : 0.2, 0.3); // تك
        mix.add(H, t + B / 4, 0.25, -0.3);
      } else if (mode === 'tense') {
        if (sub === 0 && inBar === 0) mix.add(K, t, 0.6);
        mix.add(H, t, 0.22, -0.3);
      }
    }
  }
  // باص
  const bars = Math.ceil(DURATION_SECONDS / (4 * B));
  for (let bar = 0; bar < bars; bar++) {
    const f = hz(M.root, M.prog[bar % 4]);
    for (let st = 0; st < 8; st++) {
      const t = bar * 4 * B + st * (B / 2); const mode = intensityAt(t);
      if (mode === 'gap' || t >= DURATION_SECONDS) continue;
      if (mode === 'tense') { if (st === 0) mix.add(bass(f, 4 * B - 0.05), t, 0.35); continue; }
      if ([0, 3, 4, 6].includes(st)) mix.add(bass(f * (st === 6 ? 2 : 1), B / 2 - 0.02), t, 0.55);
    }
  }
  // لحن (عود مصطنع)
  const totalSteps = Math.floor(DURATION_SECONDS / (B / 2));
  for (let st = 0; st < totalSteps; st++) {
    const t = st * (B / 2); const mode = intensityAt(t);
    const n = M.motif[st % 16];
    if (n === null || mode === 'gap' || mode === 'tense') continue;
    const g = mode === 'groove' ? 0.22 : 0.3;
    mix.add(pluck(hz(M.root, n + M.prog[Math.floor(st / 8) % 4] * 0), 0.6, M.bright), t, g, 0.15);
  }
}

function buildSfx(mix, variant) {
  const at = (frame) => fsec(frame);
  const cue = HOOK_CUES[variant];
  const bt = (n) => beatSec(n);
  // الهوك
  if (variant === 'A') {
    mix.add(impact(), bt(cue.badge), 0.7);
    mix.add(pop(), bt(cue.eye), 0.5);
    [cue.word1, cue.word2].forEach((w) => { mix.add(glitch(), bt(w), 0.5); mix.add(kick(), bt(w), 0.5); });
    mix.add(impact(), bt(cue.word3), 0.85); mix.add(glitch(), bt(cue.word3), 0.4);
  } else if (variant === 'B') {
    mix.add(whoosh(bt(cue.focus), false), 0, 0.6);
    mix.add(pop(), bt(cue.text) + 0.05, 0.5);
    mix.add(impact(), bt(cue.focus), 0.6); mix.add(pop(), bt(cue.title), 0.6);
  } else if (variant === 'C') {
    mix.add(whoosh(0.35), bt(cue.right), 0.7, 0.6);
    mix.add(whoosh(0.35), bt(cue.left) - 0.1, 0.7, -0.6);
    mix.add(impact(), bt(cue.vs), 0.9); mix.add(glitch(), bt(cue.vs), 0.35);
    mix.add(pop(), bt(cue.question), 0.6);
  }
  // انتقال الهوك ← الشبكة
  mix.add(whoosh(bt(1), true), bt(cue.exit), 0.6);
  // ظهور الشبكة: pop لكل صف
  for (let r = 0; r < 5; r++) mix.add(pop(), at(SECTIONS.intro.from) + r * 0.06, 0.35, (r - 2) * 0.2);
  // العد التنازلي: tick كل نص ثانية + beep على كل رقم
  for (let i = 0; i < COUNTDOWN_FROM; i++) {
    const t = at(countdownFrame(i));
    mix.add(beep(660 + i * 110), t, 0.45);
    mix.add(tick(), t + B, 0.4);
  }
  // دعوة الكومنتير
  mix.add(pop(), at(SECTIONS.comment.from), 0.5);
  // تصاعد قبل الكشف
  const revealT = at(SECTIONS.reveal.from);
  mix.add(riser(2 * B), revealT - 2 * B - B / 2, 0.5);
  const C = clap();
  for (let k = 0; k < 8; k++) mix.add(C, revealT - 2 * B - B / 2 + k * (B / 4), 0.12 + k * 0.03);
  // الكشف
  mix.add(impact(), revealT, 0.9); mix.add(ding(), revealT, 0.7); mix.add(sparkle(), revealT + 0.1, 0.6);
  // المشاركة
  mix.add(whoosh(B, true), at(SECTIONS.outro.from) - B, 0.4);
  mix.add(pop(), at(SECTIONS.outro.from), 0.5);
  mix.add(pop(), at(SECTIONS.outro.from) + B, 0.45);
  mix.add(impact(), at(SECTIONS.outro.to) - 4 * B, 0.5);
}


// node scripts/generate-audio.mjs [id] [A,B,C]
const ids = process.argv[2] ? [process.argv[2]] : fs.readdirSync('challenges').filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
const outDir = path.resolve('public/audio');
fs.mkdirSync(outDir, { recursive: true });
for (const id of ids) {
const challenge = JSON.parse(fs.readFileSync(path.join('challenges', `${id}.json`), 'utf8'));
const M = musicFor(challenge.seed, challenge.music ?? {});
console.log(`♪ ${id}: مقام ${M.scaleName} على ${M.rootName}، إيقاع ${M.groove}`);
const variants = process.argv[3] ? process.argv[3].split(',') : VARIANTS;
for (const v of variants) {
  const mix = makeMix(DURATION_SECONDS);
  buildMusic(mix, M);
  buildSfx(mix, v);
  master(mix);
  const file = path.join(outDir, `${id}-${v}.wav`);
  writeWav(file, mix);
  console.log('✔', path.relative(process.cwd(), file));
}
}
