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

// الأخبار: news/*.json → src/news.generated.ts
const newsFiles = fs.existsSync('news') ? fs.readdirSync('news').filter((f) => f.endsWith('.json')).sort() : [];
fs.writeFileSync(path.join('src', 'news.generated.ts'), [
  '// ⚠️ ملف مولّد تلقائياً بـ scripts/index-challenges.mjs — ما تعدلوش بيدك',
  "import type { NewsBrief } from './news/types';",
  ...newsFiles.map((f, i) => `import n${i} from '../news/${f}';`),
  '',
  `export const NEWS = [${newsFiles.map((_, i) => `n${i}`).join(', ')}] as unknown as NewsBrief[];`,
  '',
].join('\n'));
console.log(`✔ src/news.generated.ts (${newsFiles.length} نشرات)`);

// أخبار الأسبوع: weekly/*.json → src/weekly.generated.ts
const weeklyFiles = fs.existsSync('weekly') ? fs.readdirSync('weekly').filter((f) => /^\d{4}-W\d+\.json$/.test(f)).sort() : [];
fs.writeFileSync(path.join('src', 'weekly.generated.ts'), [
  '// ⚠️ ملف مولّد تلقائياً بـ scripts/index-challenges.mjs — ما تعدلوش بيدك',
  "import type { Weekly } from './weekly/WeeklyVideo';",
  ...weeklyFiles.map((f, i) => `import w${i} from '../weekly/${f}';`),
  '',
  `export const WEEKLY = [${weeklyFiles.map((_, i) => `w${i}`).join(', ')}] as unknown as Weekly[];`,
  '',
].join('\n'));
console.log(`✔ src/weekly.generated.ts (${weeklyFiles.length})`);
