// كيولّد src/challenges.generated.ts فيه كل ملفات challenges/*.json (باش Remotion يعرفهم)
import fs from 'node:fs';
import path from 'node:path';

const files = fs.readdirSync('challenges').filter((f) => f.endsWith('.json')).sort();
const lines = [
  '// ⚠️ ملف مولّد تلقائياً بـ scripts/index-challenges.mjs — ما تعدلوش بيدك',
  "import type { Challenge } from './types';",
  ...files.map((f, i) => `import c${i} from '../challenges/${f}';`),
  '',
  `export const CHALLENGES = [${files.map((_, i) => `c${i}`).join(', ')}] as unknown as Challenge[];`,
  '',
];
fs.writeFileSync(path.join('src', 'challenges.generated.ts'), lines.join('\n'));
console.log(`✔ src/challenges.generated.ts (${files.length} حلقات)`);
