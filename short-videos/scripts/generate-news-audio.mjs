// موسيقى + مؤثرات نشرة الأخبار (60 ثانية، 120 BPM، بلا تعليق صوتي)
// node scripts/generate-news-audio.mjs news-2026-11-22
import fs from 'node:fs';
import path from 'node:path';
import { BPM, FPS } from '../shared/timing.js';
import { NEWS_DURATION_SECONDS, NEWS_INTRO, ITEM_CUES, itemRange, newsOutro } from '../shared/news-timing.js';
import { mulberry32 } from '../shared/color.js';
import { makeMix, master, writeWav, hz, kick, hat, clap, bass, pluck, tick, pop, whoosh, riser, impact, ding, sparkle } from '../shared/synth.js';

const B = 60 / BPM;
const fsec = (f) => f / FPS;
const files = process.argv[2] ? [`${process.argv[2]}.json`] : fs.readdirSync('news').filter((f) => f.endsWith('.json'));
fs.mkdirSync('public/audio', { recursive: true });

for (const file of files) {
  const news = JSON.parse(fs.readFileSync(path.join('news', file.replace(/^news-/, '')), 'utf8'));
  const r = mulberry32(news.seed);
  const mix = makeMix(NEWS_DURATION_SECONDS);
  const count = news.items.length;
  const outro = newsOutro(count);
  const root = 55; // La
  // مقام نهاوند (مينور) — طابع جدي ديال الأخبار
  const scale = [0, 2, 3, 5, 7, 8, 11];
  const prog = [0, 8 - 12, 3, 7 - 12]; // i – VI – III – v
  const K = kick(), H = hat(), C = clap();
  const totalBeats = Math.floor(NEWS_DURATION_SECONDS / B);
  const introEnd = fsec(NEWS_INTRO.to);
  for (let b = 0; b < totalBeats; b++) {
    const t = b * B; const inBar = b % 4;
    if (t < introEnd - B) { if (inBar === 0) mix.add(K, t, 0.7); mix.add(H, t + B / 2, 0.2); continue; }
    mix.add(K, t, inBar === 0 || inBar === 2 ? 0.85 : 0.0);
    if (inBar === 1 || inBar === 3) mix.add(C, t, 0.3);
    for (const s of [0, 0.25, 0.5, 0.75]) mix.add(H, t + s * B, s === 0.5 ? 0.25 : 0.13, -0.25);
  }
  // باص نابض (ثُمن)
  for (let bar = 0; bar * 4 * B < NEWS_DURATION_SECONDS; bar++) {
    const f = hz(root, prog[bar % 4]);
    for (let st = 0; st < 8; st++) {
      const t = bar * 4 * B + st * (B / 2);
      if (t < introEnd - 2 * B) continue;
      mix.add(bass(f * (st % 4 === 3 ? 2 : 1), B / 2 - 0.03), t, 0.42);
    }
  }
  // أربيج خفيف (باش ما يغطيش على القراءة)
  for (let st = 0; st * (B / 2) < NEWS_DURATION_SECONDS; st++) {
    const t = st * (B / 2); if (t < introEnd) continue;
    if (r() < 0.35) continue;
    const bar = Math.floor(t / (4 * B));
    const deg = [0, 2, 4, 2, 0, 4, 6, 4][st % 8];
    mix.add(pluck(hz(root, 36 + prog[bar % 4] + scale[deg % 7]), 0.45, 0.6), t, 0.13, 0.2);
  }
  // المقدمة
  mix.add(impact(), 0, 0.8); mix.add(sparkle(), 0.1, 0.4);
  mix.add(pop(), 2 * B, 0.5); mix.add(pop(), 4 * B, 0.5);
  mix.add(riser(2 * B), introEnd - 2 * B, 0.45);
  // كل خبر: whoosh + impact خفيف + tick مع التفاصيل
  for (let i = 0; i < count; i++) {
    const s = fsec(itemRange(i).from);
    mix.add(whoosh(0.45, true), s - 0.35, 0.55, 0.4);
    mix.add(impact(), s, 0.45);
    mix.add(pop(), s + ITEM_CUES.emoji * B, 0.45);
    mix.add(tick(), s + ITEM_CUES.detail1 * B, 0.6);
    mix.add(tick(), s + ITEM_CUES.detail2 * B, 0.6);
  }
  // الخاتمة
  const o = fsec(outro.from);
  mix.add(whoosh(0.45, true), o - 0.35, 0.5); mix.add(ding(), o, 0.6); mix.add(pop(), o + 3 * B, 0.5);
  master(mix);
  const out = path.join('public/audio', `${news.id}.wav`);
  writeWav(out, mix);
  console.log('✔', out);
}
