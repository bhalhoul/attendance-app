// كيبني الخط الزمني من الصوت: بداية كل مقطع، الكلمات (للترجمة المتزامنة)، ولحظات الرسوم (cues) حسب الكلمات المنطوقة.
// node scripts/build-weekly-timeline.mjs 2026-W47
import fs from 'node:fs';
import path from 'node:path';

const week = process.argv[2];
const narr = JSON.parse(fs.readFileSync(`weekly/${week}.narration.json`, 'utf8'));
const cuesCfg = JSON.parse(fs.readFileSync(`weekly/${week}.cues.json`, 'utf8'));
const dir = path.join('public', 'voice', narr.id);
const LEAD = 0.5, GAP = 0.7, TAIL = 1.2;

// الكلمات: نجمعو الحروف حتى الفراغ
function words(al) {
  const out = []; let cur = null;
  al.chars.forEach((c, i) => {
    if (/\s/.test(c)) { if (cur) { out.push(cur); cur = null; } return; }
    if (!cur) cur = { w: '', start: al.start[i], end: al.end[i] };
    cur.w += c; cur.end = al.end[i];
  });
  if (cur) out.push(cur);
  return out;
}
// جمل الترجمة: حتى 4 كلمات، ولا نقطة/فاصلة
function phrases(ws) {
  const out = []; let cur = [];
  for (const w of ws) {
    cur.push(w);
    const brk = /[،,.!؟?:]$/.test(w.w);
    if (cur.length >= 4 || (brk && cur.length >= 2) || /[.!؟?]$/.test(w.w)) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out.map((p) => ({ words: p, start: p[0].start, end: p.at(-1).end }));
}

let t = LEAD;
const parts = [];
for (const p of narr.parts) {
  const al = JSON.parse(fs.readFileSync(path.join(dir, `${p.key}.align.json`), 'utf8'));
  const dur = al.end.at(-1);
  const ws = words(al).map((w) => ({ ...w, start: +(w.start + t).toFixed(3), end: +(w.end + t).toFixed(3) }));
  // cues: أول ظهور ديال الكلمة/العبارة ف النص
  const cues = {};
  for (const [name, needle] of Object.entries(cuesCfg[p.key] ?? {})) {
    const idx = al.text.indexOf(needle);
    if (idx < 0) { console.error(`✘ cue "${name}" (${needle}) ما لقيتوش ف ${p.key}`); process.exit(1); }
    cues[name] = +(al.start[idx] + t).toFixed(3);
  }
  parts.push({ key: p.key, audio: `voice/${narr.id}/${p.key}.mp3`, start: +t.toFixed(3), end: +(t + dur).toFixed(3),
    sceneStart: +(t - (parts.length ? GAP / 2 : LEAD)).toFixed(3), words: ws, phrases: phrases(ws), cues });
  t += dur + GAP;
}
for (let i = 0; i < parts.length; i++) parts[i].sceneEnd = i + 1 < parts.length ? parts[i + 1].sceneStart : +(t - GAP + TAIL).toFixed(3);
const total = Math.ceil((t - GAP + TAIL) * 30) / 30;
const out = { id: narr.id, durationSec: +total.toFixed(3), parts };
fs.writeFileSync(`weekly/${week}.timeline.json`, JSON.stringify(out));
console.log(`✔ weekly/${week}.timeline.json — ${total.toFixed(1)}s`);
parts.forEach((p) => console.log(`  ${p.key.padEnd(8)} ${p.sceneStart.toFixed(1)} → ${p.sceneEnd.toFixed(1)}  cues: ${Object.entries(p.cues).map(([k, v]) => `${k}@${v.toFixed(1)}`).join(' ')}`));
