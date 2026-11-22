// إنشاء حلقة جديدة: ألوان + موضع جواب تلقائياً.
// مثال: npm run new-challenge -- --id ep002 --seed 42 --difficulty medium --title "..."
import fs from 'node:fs';
import path from 'node:path';
import { generateColors, pickAnswer, validateChallenge } from '../shared/challenge.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);
const dir = path.resolve('challenges');
const id = args.id;
if (!id) { console.error('خاص --id (مثلاً ep002)'); process.exit(1); }
const seed = Number(args.seed ?? Math.floor(Math.random() * 1e6));
const difficulty = args.difficulty ?? 'medium';
const template = JSON.parse(fs.readFileSync(path.join(dir, args.template ?? 'ep001.json'), 'utf8'));

// ما نعاودوش نفس رقم الجواب ديال الحلقات اللي فاتو مباشرة
const previous = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).answer);

const colors = generateColors({ seed, difficulty });
const challenge = {
  ...template,
  id,
  seed,
  difficulty,
  ...colors,
  answer: pickAnswer({ seed, rows: template.grid.rows, cols: template.grid.cols, avoid: previous.slice(-3) }),
  texts: { ...template.texts, ...(args.title ? { title: args.title } : {}) },
};
const v = validateChallenge(challenge);
if (!v.ok) { console.error(v.errors.join('\n')); process.exit(1); }
const out = path.join(dir, `${id}.json`);
if (fs.existsSync(out) && !('force' in args)) { console.error(`${out} موجود. زيد --force 1 باش تكتب فوقو.`); process.exit(1); }
fs.writeFileSync(out, JSON.stringify(challenge, null, 2) + '\n');
console.log(`✔ ${out}\n  base ${challenge.baseColor}  odd ${challenge.oddColor}  ΔE=${challenge.deltaE}  الجواب: ${challenge.answer}`);
