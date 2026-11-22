// استوديو الأخبار — المرحلة 1: الصوت (ElevenLabs مع ذاكرة) + الخط الزمني
// node scripts/studio-build.mjs studio/episodes/2026-11-22-top.json
// → public/voice/studio/<hash>.mp3 (ذاكرة: نفس النص = بلا استهلاك جديد) + studio/build/<id>.timeline.json
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const brand = JSON.parse(fs.readFileSync('studio/brand.json', 'utf8'));
const ep = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const V = brand.voice;
const cacheDir = path.join('public', 'voice', 'studio');
fs.mkdirSync(cacheDir, { recursive: true });
const LEAD = 0.35, GAP = ep.format === 'quick' ? 0.35 : 0.5, TAIL = 1.3;

function tts(text, prev, next) {
  const h = crypto.createHash('sha1').update(JSON.stringify([V.id, V.model, V.settings, text])).digest('hex').slice(0, 16);
  const mp3 = path.join(cacheDir, `${h}.mp3`), al = path.join(cacheDir, `${h}.align.json`);
  if (!fs.existsSync(mp3)) {
    const body = { text, model_id: V.model, voice_settings: V.settings, previous_text: prev, next_text: next };
    const req = path.join(cacheDir, `.${h}.req.json`); fs.writeFileSync(req, JSON.stringify(body));
    const raw = execFileSync('curl', ['-sS', '--max-time', '180', '-w', '\n%{http_code}', '-X', 'POST',
      `https://api.elevenlabs.io/v1/text-to-speech/${V.id}/with-timestamps?output_format=mp3_44100_128`,
      '-H', 'Content-Type: application/json', '-H', `xi-api-key: ${process.env.ELEVENLABS_API_KEY ?? 'proxy-injected'}`, '--data-binary', `@${req}`], { maxBuffer: 1 << 28 }).toString();
    fs.rmSync(req);
    const code = raw.slice(raw.lastIndexOf('\n') + 1), json = raw.slice(0, raw.lastIndexOf('\n'));
    if (code !== '200') throw new Error(`ElevenLabs HTTP ${code}: ${json.slice(0, 300)}`);
    const d = JSON.parse(json);
    fs.writeFileSync(mp3, Buffer.from(d.audio_base64, 'base64'));
    fs.writeFileSync(al, JSON.stringify({ text, chars: d.alignment.characters, start: d.alignment.character_start_times_seconds, end: d.alignment.character_end_times_seconds }));
    console.log(`🎙 جديد: ${text.slice(0, 40)}… (${text.length} حرف)`);
  } else console.log(`♻ من الذاكرة: ${text.slice(0, 40)}…`);
  // تسريع خفيف بلا تغيير الطبقة
  const fast = path.join(cacheDir, `${h}.t${V.tempo}.mp3`);
  if (!fs.existsSync(fast)) execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', mp3, '-filter:a', `atempo=${V.tempo}`, '-b:a', '192k', fast]);
  const a = JSON.parse(fs.readFileSync(al, 'utf8'));
  return { audio: path.relative('public', fast), al: { ...a, start: a.start.map((x) => x / V.tempo), end: a.end.map((x) => x / V.tempo) } };
}

function words(al, off) {
  const out = []; let cur = null;
  al.chars.forEach((c, i) => {
    if (/\s/.test(c)) { if (cur) { out.push(cur); cur = null; } return; }
    if (!cur) cur = { w: '', start: al.start[i] + off, end: al.end[i] + off };
    cur.w += c; cur.end = al.end[i] + off;
  });
  if (cur) out.push(cur);
  return out;
}
function phrases(ws) {
  const out = []; let cur = [];
  for (const w of ws) {
    cur.push(w);
    if (cur.length >= 4 || (/[،,:]$/.test(w.w) && cur.length >= 2) || /[.!؟?]$/.test(w.w)) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out.map((p) => ({ words: p, start: p[0].start, end: p.at(-1).end }));
}

let t = LEAD;
const parts = [];
ep.parts.forEach((p, i) => {
  const { audio, al } = tts(p.text, ep.parts[i - 1]?.text, ep.parts[i + 1]?.text);
  const dur = al.end.at(-1);
  // "at": نص كلمة → وقت أول ظهور ديالها ف الصوت ("start" = بداية الجزء)
  const resolve = (o) => {
    if (Array.isArray(o)) return o.map(resolve);
    if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => {
      if ((k === 'at' || k.endsWith('At')) && typeof v === 'string') {
        if (v === 'start') return [k, +(t).toFixed(3)];
        const idx = al.text.indexOf(v);
        if (idx < 0) throw new Error(`✘ "${v}" ما كايناش ف نص الجزء "${p.key}"`);
        return [k, +(al.start[idx] + t).toFixed(3)];
      }
      return [k, resolve(v)];
    }));
    return o;
  };
  const ws = words(al, t);
  parts.push({ ...resolve(p), audio, start: +t.toFixed(3), end: +(t + dur).toFixed(3),
    sceneStart: +(i ? t - GAP / 2 : 0).toFixed(3), words: ws, phrases: phrases(ws) });
  t += dur + GAP;
});
parts.forEach((p, i) => { p.sceneEnd = i + 1 < parts.length ? parts[i + 1].sceneStart : +(t - GAP + TAIL).toFixed(3); });
const durationSec = Math.ceil((t - GAP + TAIL) * 30) / 30;
const out = { id: ep.id, format: ep.format, dateLabel: ep.dateLabel, brand, durationSec, parts };
fs.writeFileSync(path.join('studio', 'build', `${ep.id}.timeline.json`), JSON.stringify(out));
console.log(`✔ studio/build/${ep.id}.timeline.json — ${durationSec.toFixed(1)}s`);
