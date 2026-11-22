// توليد صوت المذيع بـ ElevenLabs (مع توقيت كل حرف) — المفتاح كيتزاد أوتوماتيكياً من بروكسي البيئة،
// ولا من متغير ELEVENLABS_API_KEY إلا خدمتي محلياً.
// node scripts/tts-elevenlabs.mjs weekly/2026-W47.narration.json [key1,key2]   (بلا keys = كلشي)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const file = process.argv[2];
const only = process.argv[3]?.split(',');
const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
const outDir = path.join('public', 'voice', cfg.id);
fs.mkdirSync(outDir, { recursive: true });
const headers = { 'Content-Type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY ?? 'proxy-injected' };

for (const [i, part] of cfg.parts.entries()) {
  if (only && !only.includes(part.key)) continue;
  const body = {
    text: part.text,
    model_id: cfg.model,
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
    previous_text: cfg.parts[i - 1]?.text, next_text: cfg.parts[i + 1]?.text, // باش النبرة تكون متصلة بين المقاطع
  };
  // curl (ماشي fetch) باش الطلب يدوز من البروكسي ديال البيئة
  const reqFile = path.join(outDir, `.${part.key}.req.json`);
  fs.writeFileSync(reqFile, JSON.stringify(body));
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${cfg.voiceId}/with-timestamps?output_format=mp3_44100_128`;
  const raw = execFileSync('curl', ['-sS', '--max-time', '180', '-w', '\n%{http_code}', '-X', 'POST', url,
    '-H', 'Content-Type: application/json', '-H', `xi-api-key: ${headers['xi-api-key']}`, '--data-binary', `@${reqFile}`], { maxBuffer: 1 << 28 }).toString();
  fs.rmSync(reqFile);
  const code = raw.slice(raw.lastIndexOf('\n') + 1), json = raw.slice(0, raw.lastIndexOf('\n'));
  if (code !== '200') { console.error(`✘ ${part.key}: HTTP ${code} ${json.slice(0, 300)}`); process.exit(1); }
  const d = JSON.parse(json);
  fs.writeFileSync(path.join(outDir, `${part.key}.mp3`), Buffer.from(d.audio_base64, 'base64'));
  const a = d.alignment;
  fs.writeFileSync(path.join(outDir, `${part.key}.align.json`), JSON.stringify({
    text: part.text, chars: a.characters, start: a.character_start_times_seconds, end: a.character_end_times_seconds,
  }));
  console.log(`✔ ${part.key}: ${a.character_end_times_seconds.at(-1).toFixed(2)}s`);
}
