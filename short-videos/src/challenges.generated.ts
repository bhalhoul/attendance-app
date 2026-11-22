// ⚠️ ملف مولّد تلقائياً بـ scripts/index-challenges.mjs — ما تعدلوش بيدك
import type { Challenge } from './types';
import c0 from '../challenges/ep001.json';
import c1 from '../challenges/ep002.json';
import c2 from '../challenges/ep003.json';
import c3 from '../challenges/ep004.json';
import c4 from '../challenges/ep005.json';
import c5 from '../challenges/ep006.json';
import c6 from '../challenges/ep007.json';

export const CHALLENGES = [c0, c1, c2, c3, c4, c5, c6] as unknown as Challenge[];
