// موسيقى + مؤثرات "أخبار الأسبوع" (طول حر، بلا تعليق صوتي). node scripts/generate-weekly-audio.mjs 2026-W47
import fs from 'node:fs';
import path from 'node:path';
import { BPM } from '../shared/timing.js';
import { slideTimes } from '../shared/weekly-timing.js';
import { mulberry32 } from '../shared/color.js';
import { makeMix, master, writeWav, hz, kick, hat, clap, bass, pluck, tick, pop, whoosh, riser, impact, ding, sparkle } from '../shared/synth.js';

const B = 60 / BPM;
const files = process.argv[2] ? [`${process.argv[2]}.json`] : fs.readdirSync('weekly').filter((f) => f.endsWith('.json'));
fs.mkdirSync('public/audio', { recursive: true });

for (const file of files) {
  const w = JSON.parse(fs.readFileSync(path.join('weekly', file), 'utf8'));
  const r = mulberry32(w.seed);
  const D = w.durationSec;
  const mix = makeMix(D);
  const K = kick(), H = hat(), C = clap();
  // كل مقطع عندو نغمة أساس مختلفة شوية باش الموسيقى ما تمللش على 3 دقايق
  const ROOTS = [55, 49, 58.27, 51.91, 55, 49];
  const sectionAt = (t) => {
    if (t < w.intro.to) return { idx: -1, root: 55, mode: t < 3 ? 'soft' : 'full' };
    const i = w.segments.findIndex((s) => t >= s.from && t < s.to);
    if (i >= 0) return { idx: i, root: ROOTS[i % ROOTS.length], mode: 'full' };
    return { idx: 99, root: 55, mode: t > D - 4 ? 'soft' : 'full' };
  };
  const prog = [0, -4, 3, -5]; // i – VI – III – v (نهاوند)
  const scale = [0, 2, 3, 5, 7, 8, 11];
  for (let b = 0; b * B < D; b++) {
    const t = b * B, inBar = b % 4, { mode } = sectionAt(t);
    if (mode === 'soft') { if (inBar === 0) mix.add(K, t, 0.55); mix.add(H, t + B / 2, 0.15); continue; }
    if (inBar === 0 || inBar === 2) mix.add(K, t, 0.8);
    if (inBar === 1 || inBar === 3) mix.add(C, t, 0.25);
    for (const s of [0, 0.5]) mix.add(H, t + s * B, s ? 0.2 : 0.1, -0.25);
  }
  for (let st = 0; st * (B / 2) < D; st++) {
    const t = st * (B / 2); const { root, mode } = sectionAt(t);
    const bar = Math.floor(t / (4 * B));
    if (mode !== 'soft') mix.add(bass(hz(root, prog[bar % 4]) * (st % 4 === 3 ? 2 : 1), B / 2 - 0.03), t, 0.38);
    if (mode !== 'soft' && r() > 0.45) {
      const deg = [0, 2, 4, 2, 0, 4, 6, 4][st % 8];
      mix.add(pluck(hz(root, 36 + prog[bar % 4] + scale[deg]), 0.45, 0.6), t, 0.1, 0.2);
    }
  }
  // المقدمة
  mix.add(impact(), 0, 0.8); mix.add(sparkle(), 0.1, 0.4); mix.add(pop(), 0.5, 0.4); mix.add(pop(), 1.0, 0.4);
  w.intro.teasers.forEach((_, i) => mix.add(pop(), 3 + i * 2, 0.45));
  mix.add(riser(2 * B), w.intro.to - 2 * B, 0.45);
  // المقاطع
  for (const seg of w.segments) {
    mix.add(whoosh(0.5, true), seg.from - 0.4, 0.55, 0.4); mix.add(impact(), seg.from, 0.5); mix.add(pop(), seg.from + 0.1, 0.4);
    for (const s of slideTimes(seg)) {
      if (s.stat) { mix.add(impact(), s.start, 0.3); mix.add(pop(), s.start, 0.5); }
      else if (s.question) mix.add(ding(), s.start, 0.35);
      else mix.add(tick(), s.start, 0.5);
    }
  }
  // الخاتمة
  mix.add(whoosh(0.5, true), w.outro.from - 0.4, 0.5); mix.add(ding(), w.outro.from, 0.55);
  [1.5, 1.7, 1.9, 2.1, 2.3].forEach((d) => mix.add(pop(), w.outro.from + d, 0.35));
  mix.add(pop(), w.outro.from + 5, 0.45); mix.add(pop(), w.outro.from + 13, 0.45); mix.add(pop(), w.outro.from + 18, 0.45);
  master(mix);
  const out = path.join('public/audio', `${w.id}.wav`);
  writeWav(out, mix);
  console.log('✔', out);
}
