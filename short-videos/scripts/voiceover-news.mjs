// تعليق صوتي لنشرة الأخبار (espeak-ng + MBROLA عربي، بلا إنترنت) ← دمج مع الموسيقى بـ FFmpeg (ducking)
// npm run voice:news -- --date 2026-11-22 [--voice mb-ar2]
// المتطلبات: apt-get install espeak-ng mbrola mbrola-ar1 mbrola-ar2
// ملاحظة: النص خاصو يكون فصيح ومشكول بالكامل (voice/<date>.json) باش الحروف يتنطقو صحيح.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { FPS } from '../shared/timing.js';
import { NEWS_INTRO, itemRange, newsOutro, NEWS_DURATION_SECONDS } from '../shared/news-timing.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') && a.push([x.slice(2), arr[i + 1]]), a), []));
const date = args.date ?? new Date().toISOString().slice(0, 10);
const voice = args.voice ?? 'mb-ar2';
const script = JSON.parse(fs.readFileSync(path.join('voice', `${date}.json`), 'utf8'));
const news = JSON.parse(fs.readFileSync(path.join('news', `${date}.json`), 'utf8'));
if (script.items.length !== news.items.length) { console.error('عدد سطور التعليق خاصو يساوي عدد الأخبار'); process.exit(1); }

const tmp = path.join('out', '.voice'); fs.mkdirSync(tmp, { recursive: true });
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const sec = (frame) => frame / FPS;
const outro = newsOutro(news.items.length);

// [النص، بداية، المدة المتاحة]
const lines = [
  [script.intro, 0.15, sec(NEWS_INTRO.to) - 0.25],
  ...script.items.map((t, i) => [t, sec(itemRange(i).from) + 0.3, sec(itemRange(i).to - itemRange(i).from) - 0.6]),
  [script.outro, sec(outro.from) + 0.2, NEWS_DURATION_SECONDS - sec(outro.from) - 1.1],
];

// ---- تصحيح النطق العربي ----
// 1) الشدة قبل الحركة (espeak-ng كيضيّع الحركة إلا جات الشدة من بعدها)
const normalize = (t) => t.replace(/([\u064B-\u0650\u0652])\u0651/g, '\u0651$1');
// 2) أسماء الفونيمات ديال espeak-ng ماشي هي اللي كيعرف MBROLA → بلا تصحيح كيتحولو لسكوت
//    (الراء R كانت كتختفي كاملة، والغين Q ف ar2)
const PHONE_MAP = { R: 'r', Q: 'G', gH: 'G' };
const VOICE_DB = { 'mb-ar1': '/usr/share/mbrola/ar1/ar1', 'mb-ar2': '/usr/share/mbrola/ar2/ar2' };
function fixPho(pho) {
  const rows = pho.split('\n').filter((l) => l.trim()).map((l) => l.trim().split(/\s+/));
  for (const r of rows) if (PHONE_MAP[r[0]]) r[0] = PHONE_MAP[r[0]];
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], prev = out[out.length - 1];
    // espeak-ng كيزيد n قبل الميم المشددة (ثُمَّ → n m m): كنحيدوها
    if (r[0] === 'n' && rows[i + 1]?.[0] === 'm' && rows[i + 2]?.[0] === 'm') continue;
    // "l-?" ما موجودش: الهمزة بعد لام التعريف كتدمج (الأخبار → al-akhbaar)
    if (r[0] === '?' && prev && prev[0] === 'l') { prev[1] = String(Number(prev[1]) + Number(r[1]) / 2); continue; }
    // بعد حرف مفخّم، الحركة الطويلة (i. i) كتولّي حركة مفخّمة وحدة أطول
    if (prev && /^[aiu]\.$/.test(prev[0]) && r[0] === prev[0][0]) { prev[1] = String(Number(prev[1]) + Number(r[1])); continue; }
    out.push(r);
  }
  return out.map((r) => r.join(' ')).join('\n') + '\n';
}
function synth(text, speed, wav) {
  const pho = execFileSync('espeak-ng', ['-v', voice, '-q', '--pho', '-s', String(speed), normalize(text)]).toString();
  const phoFile = wav.replace('.wav', '.pho');
  fs.writeFileSync(phoFile, fixPho(pho));
  // بلا -e: إلا بقى شي diphone ناقص، كيطيح خطأ بلاصة ما يسكت الحرف
  execFileSync('mbrola', [VOICE_DB[voice], phoFile, wav], { stdio: ['ignore', 'ignore', 'pipe'] });
}

const parts = [];
for (const [i, [text, start, budget]] of lines.entries()) {
  const f = path.join(tmp, `${voice}-${i}.wav`);
  let speed = 150, d = Infinity;
  // نزيدو السرعة شوية بشوية حتى يدخل السطر فالوقت ديالو (حد أقصى 195 باش يبقى مفهوم)
  for (; speed <= 195; speed += 5) {
    synth(text, speed, f);
    d = dur(f);
    if (d <= budget) break;
  }
  if (d > budget) console.warn(`⚠ السطر ${i} طويل (${d.toFixed(1)}s > ${budget.toFixed(1)}s) — قصّر النص`);
  console.log(`🎙 ${i}: ${d.toFixed(1)}s / ${budget.toFixed(1)}s @ ${speed}`);
  parts.push({ f, start });
}

// مسار الصوت: معالجة خفيفة (تنظيف + ضغط + حضور) ومن بعد وضع كل سطر فوقتو
const vTrack = path.join(tmp, `${voice}-track.wav`);
const inputs = parts.flatMap((p) => ['-i', p.f]);
const delays = parts.map((p, i) => `[${i}:a]aresample=48000,adelay=${Math.round(p.start * 1000)}|${Math.round(p.start * 1000)},apad=whole_dur=${NEWS_DURATION_SECONDS}[d${i}]`).join(';');
const mixIn = parts.map((_, i) => `[d${i}]`).join('');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex',
  `${delays};${mixIn}amix=inputs=${parts.length}:normalize=0,highpass=f=90,lowpass=f=9000,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,equalizer=f=3000:t=q:w=1:g=3,volume=1.6,atrim=0:${NEWS_DURATION_SECONDS}[v]`,
  '-map', '[v]', '-ac', '2', vTrack]);

// الدمج: الموسيقى كتنقص أوتوماتيكياً ملي كيهضر التعليق (sidechain ducking)
const music = path.join('public/audio', `${news.id}.wav`);
const video = path.join('out', `${news.id}.mp4`);
if (!fs.existsSync(video)) { console.error(`خاص الفيديو ${video} (npm run render:news) قبل`); process.exit(1); }
const final = path.join('out', `${news.id}-voice-${voice}.mp4`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', music, '-i', vTrack, '-filter_complex',
  '[1:a]aresample=48000,volume=0.8[m];[2:a]asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[duck];' +
  '[duck][v2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-2:LRA=11,aresample=48000,alimiter=limit=0.7:level=false[a]',
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart',
  '-metadata', `title=${news.brand} — ${news.dateLabel} (تعليق صوتي)`, final]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('✔', final);
