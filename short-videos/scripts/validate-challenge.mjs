// التحقق من كل الحلقات: الجواب موجود فالشبكة والفرق فاللون معقول.
import fs from 'node:fs';
import path from 'node:path';
import { validateChallenge } from '../shared/challenge.js';

const dir = path.resolve('challenges');
let failed = false;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const r = validateChallenge(c);
  console.log(`${r.ok ? '✔' : '✘'} ${f}  ΔE2000=${r.deltaE.toFixed(2)}  الجواب=${c.answer}`);
  r.errors.forEach((e) => console.log('   - ' + e));
  if (!r.ok) failed = true;
}
process.exit(failed ? 1 : 0);
