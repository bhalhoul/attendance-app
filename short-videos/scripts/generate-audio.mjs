// توليد الموسيقى والمؤثرات برمجياً (بدون أي ملف خارجي → بدون مشاكل حقوق).
// الإيقاع 120 BPM، مقام حجاز خفيف، دربوكة (دوم/تك) + باص + نقر وتري (Karplus-Strong).
// الخرج: public/audio/<id>-<variant>.wav
import fs from 'node:fs';
import path from 'node:path';
import { DURATION_SECONDS, BPM, SECTIONS, FPS, HOOK_CUES, VARIANTS, beatSec, countdownFrame, COUNTDOWN_FROM } from '../shared/timing.js';
import { mulberry32 } from '../shared/color.js';

const SR = 44100;
const N = Math.ceil(DURATION_SECONDS * SR);
const B = 60 / BPM; // ثانية لكل ضربة
const fsec = (frame) => frame / FPS;
const rand = mulberry32(1234);
const noise = () => rand() * 2 - 1;

// ---------- آلات ----------
const gen = (dur, fn) => { const n = Math.floor(dur * SR); const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = fn(i / SR, i); return o; };
const lp = (x, a) => { let y = 0; return x.map((v) => (y += a * (v - y))); };
const hp = (x, a) => { const l = lp(x, a); return x.map((v, i) => v - l[i]); };

function kick() { let ph = 0; return gen(0.4, (t) => { ph += (2 * Math.PI * (48 + 110 * Math.exp(-t * 32))) / SR; return Math.sin(ph) * Math.exp(-t * 8) + (t < 0.004 ? noise() * 0.3 : 0); }); }
function doum() { let ph = 0; return gen(0.35, (t) => { ph += (2 * Math.PI * (80 + 40 * Math.exp(-t * 20))) / SR; return Math.sin(ph) * Math.exp(-t * 9) * 0.8; }); }
function tek() { const n = hp(gen(0.08, () => noise()), 0.35); return n.map((v, i) => { const t = i / SR; return (v * 0.7 + Math.sin(2 * Math.PI * 2400 * t) * 0.3) * Math.exp(-t * 70); }); }
function hat() { const n = hp(gen(0.06, () => noise()), 0.15); return n.map((v, i) => v * Math.exp((-i / SR) * 90) * 0.5); }
function clap() { const n = hp(lp(gen(0.25, () => noise()), 0.5), 0.08); return n.map((v, i) => { const t = i / SR; const bursts = t < 0.03 ? (Math.floor(t / 0.01) % 2 === 0 ? 1 : 0.4) : 1; return v * bursts * Math.exp(-t * 16); }); }
function bass(freq, dur) { let ph = 0; return gen(dur, (t) => { ph += (2 * Math.PI * freq) / SR; const env = Math.min(1, t / 0.008) * Math.min(1, (dur - t) / 0.05); return (Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) * env * 0.6; }); }
function pluck(freq, dur, bright = 0.5) {
  const n = Math.floor(dur * SR); const p = Math.max(2, Math.round(SR / freq));
  const buf = new Float32Array(p).map(() => noise()); const o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const j = i % p; const nx = (j + 1) % p; o[i] = buf[j]; buf[j] = (buf[j] * bright + buf[nx] * (1 - bright)) * 0.996; }
  return o.map((v, i) => v * Math.min(1, (n - i) / (0.03 * SR)));
}
const blip = (f, dur, decay) => gen(dur, (t) => Math.sin(2 * Math.PI * f * t) * Math.exp(-t * decay));
const tick = () => blip(3200, 0.03, 160).map((v) => v * 0.6);
function beep(f) { return gen(0.22, (t) => (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t * 14) * Math.min(1, t / 0.003)); }
function pop() { let ph = 0; return gen(0.09, (t) => { ph += (2 * Math.PI * (900 * Math.exp(-t * 25) + 220)) / SR; return Math.sin(ph) * Math.exp(-t * 40); }); }
function whoosh(dur, rising = true) {
  const n = Math.floor(dur * SR); const o = new Float32Array(n); let y = 0, y2 = 0;
  for (let i = 0; i < n; i++) { const p = i / n; const pr = rising ? p : 1 - p; const a = 0.01 + 0.35 * pr * pr; y += a * (noise() - y); y2 += a * (y - y2); const env = Math.sin(Math.PI * Math.min(1, rising ? p ** 0.6 : p)) ; o[i] = (y - y2 * 0.5) * env * 1.4; }
  return o;
}
function riser(dur) { let ph = 0; const n = lp(gen(dur, () => noise()), 0.2); return gen(dur, (t, i) => { const p = t / dur; ph += (2 * Math.PI * (200 + 1400 * p * p)) / SR; return (Math.sin(ph) * 0.25 + n[i] * 0.6) * p * p; }); }
function impact() { let ph = 0; const n = lp(gen(1.4, () => noise()), 0.08); return gen(1.4, (t, i) => { ph += (2 * Math.PI * (35 + 60 * Math.exp(-t * 6))) / SR; return Math.sin(ph) * Math.exp(-t * 2.6) * 1.1 + n[i] * Math.exp(-t * 5) * 1.6; }); }
function ding() { const parts = [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.93, 0.12]]; return gen(1.6, (t) => parts.reduce((s, [m, a]) => s + a * Math.sin(2 * Math.PI * 1046.5 * m * t) * Math.exp(-t * (2.2 + m)), 0) * 0.6); }
function sparkle() { const o = new Float32Array(Math.floor(0.9 * SR)); [2093, 2637, 3136, 4186].forEach((f, k) => { const b = blip(f, 0.4, 12); const off = Math.floor(k * 0.07 * SR); b.forEach((v, i) => { if (off + i < o.length) o[off + i] += v * 0.25; }); }); return o; }
function glitch() { return gen(0.12, (t) => (Math.sign(Math.sin(2 * Math.PI * (180 + 600 * (Math.floor(t * 80) % 3)) * t)) * 0.3 + noise() * 0.2) * Math.exp(-t * 18)); }

// ---------- ميكسر ----------
function makeMix() {
  const L = new Float32Array(N), R = new Float32Array(N);
  const add = (s, t, g = 1, pan = 0) => {
    const i0 = Math.floor(t * SR); const gl = g * Math.min(1, 1 - pan), gr = g * Math.min(1, 1 + pan);
    for (let i = 0; i < s.length && i0 + i < N; i++) { if (i0 + i < 0) continue; L[i0 + i] += s[i] * gl; R[i0 + i] += s[i] * gr; }
  };
  return { L, R, add };
}

// مقام حجاز على "لا"
const NOTE = { A1: 55, Bb1: 58.27, G1: 49, A4: 440, Bb4: 466.16, Cs5: 554.37, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880 };
const BASS_BARS = ['A1', 'A1', 'Bb1', 'A1', 'G1', 'A1', 'Bb1', 'A1', 'A1'];
// موتيف بالـ 1/8 (null = سكتة)، 16 خطوة = 2 ميزورات
const MOTIF = ['A4', null, 'Bb4', 'Cs5', 'D5', null, 'E5', null, 'F5', 'E5', 'D5', null, 'Cs5', 'Bb4', 'A4', null];

function intensityAt(t) {
  const s = (f) => fsec(f);
  if (t < s(SECTIONS.countdown.from)) return 'full';
  if (t < s(SECTIONS.comment.from)) return 'tense';
  if (t < s(SECTIONS.reveal.from) - B / 2) return 'groove';
  if (t < s(SECTIONS.reveal.from)) return 'gap';
  return 'full';
}

function buildMusic(mix) {
  const K = kick(), D = doum(), T = tek(), H = hat(), C = clap();
  const totalBeats = Math.floor(DURATION_SECONDS / B);
  for (let b = 0; b < totalBeats; b++) {
    for (const sub of [0, 0.5]) {
      const t = (b + sub) * B; const mode = intensityAt(t);
      if (mode === 'gap') continue;
      const inBar = b % 4;
      if (mode === 'full' || mode === 'groove') {
        if (sub === 0 && (inBar === 0 || inBar === 2)) mix.add(K, t, 0.9);
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
  for (let bar = 0; bar < BASS_BARS.length; bar++) {
    const f = NOTE[BASS_BARS[bar]];
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
    const n = MOTIF[st % 16];
    if (!n || mode === 'gap' || mode === 'tense') continue;
    const g = mode === 'groove' ? 0.22 : 0.3;
    mix.add(pluck(NOTE[n], 0.6, 0.55), t, g, 0.15);
  }
}

function buildSfx(mix, variant) {
  const at = (frame) => fsec(frame);
  const cue = HOOK_CUES[variant];
  const bt = (n) => beatSec(n);
  // الهوك
  if (variant === 'A') {
    mix.add(impact(), bt(cue.badge), 0.7);
    [cue.word1, cue.word2].forEach((w) => { mix.add(glitch(), bt(w), 0.5); mix.add(kick(), bt(w), 0.5); });
    mix.add(impact(), bt(cue.word3), 0.85); mix.add(glitch(), bt(cue.word3), 0.4);
  } else if (variant === 'B') {
    mix.add(whoosh(bt(cue.focus), false), 0, 0.6);
    mix.add(pop(), bt(cue.text) + 0.05, 0.5);
    mix.add(impact(), bt(cue.focus), 0.6); mix.add(pop(), bt(cue.title), 0.6);
  } else if (variant === 'C') {
    mix.add(whoosh(0.35), bt(cue.you) , 0.7, 0.6);
    mix.add(whoosh(0.35), bt(cue.partner) - 0.1, 0.7, -0.6);
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

function master({ L, R }) {
  // fade-out فآخر 0.8 ثانية + limiter ناعم
  const fadeStart = (DURATION_SECONDS - 0.8) * SR;
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const f = i > fadeStart ? Math.max(0, 1 - (i - fadeStart) / (0.8 * SR)) : 1;
    L[i] = Math.tanh(L[i] * 0.9) * f; R[i] = Math.tanh(R[i] * 0.9) * f;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const g = 0.89 / peak; // ≈ -1 dBFS
  for (let i = 0; i < N; i++) { L[i] *= g; R[i] *= g; }
}

function writeWav(file, L, R) {
  const data = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) { data.writeInt16LE(Math.round(L[i] * 32767), i * 4); data.writeInt16LE(Math.round(R[i] * 32767), i * 4 + 2); }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

const id = process.argv[2] ?? 'ep001';
const outDir = path.resolve('public/audio');
fs.mkdirSync(outDir, { recursive: true });
for (const v of VARIANTS) {
  const mix = makeMix();
  buildMusic(mix);
  buildSfx(mix, v);
  master(mix);
  const file = path.join(outDir, `${id}-${v}.wav`);
  writeWav(file, mix.L, mix.R);
  console.log('✔', path.relative(process.cwd(), file));
}
