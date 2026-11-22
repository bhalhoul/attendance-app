// توليد التحدي والتحقق منه: ألوان الشبكة + موضع الجواب.
import { deltaE2000, hslToHex, mulberry32, clamp } from './color.js';

// ΔE2000: أقل من 8 صعيب بزاف على الهاتف بعد ضغط الفيديو → ممنوع.
export const DIFFICULTY = {
  easy: { min: 14, max: 18 },
  medium: { min: 10, max: 13 },
  hard: { min: 8, max: 10 },
};
export const MIN_FAIR_DELTA = 8;
export const MAX_DELTA = 25;

// ألوان أساسية مريحة (درجة، تشبع، إضاءة) — متوسطة الإضاءة باش يبان الفرق.
const PALETTE = [
  [168, 62, 42], [200, 70, 48], [265, 55, 55], [330, 60, 52], [24, 78, 52],
  [140, 50, 42], [215, 60, 52], [48, 80, 48], [290, 45, 50], [355, 65, 52],
];

/**
 * الفرق كيكون فالإضاءة (Lightness) أساساً، ماشي غير فالدرجة،
 * باش يبقى التحدي عادل حتى للناس اللي عندهم عمى الألوان.
 */
export function generateColors({ seed, difficulty = 'medium' }) {
  const rand = mulberry32(seed);
  const [h, s, l] = PALETTE[Math.floor(rand() * PALETTE.length)];
  const hue = (h + (rand() * 10 - 5) + 360) % 360;
  const base = hslToHex(hue, s, l);
  const { min, max } = DIFFICULTY[difficulty];
  const target = min + rand() * (max - min);
  const dir = l > 50 ? -1 : 1; // نفتّح الغامق ونغمّق الفاتح
  // بحث ثنائي على فرق الإضاءة حتى نوصلو للـ ΔE المطلوب
  let lo = 0, hi = 30, odd = base;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    odd = hslToHex(hue, clamp(s + 4, 0, 100), clamp(l + dir * mid, 5, 95));
    if (deltaE2000(base, odd) < target) lo = mid; else hi = mid;
  }
  return { baseColor: base, oddColor: odd, deltaE: +deltaE2000(base, odd).toFixed(2) };
}

export function pickAnswer({ seed, rows = 5, cols = 5, avoid = [] }) {
  const rand = mulberry32(seed * 7 + 13);
  const total = rows * cols;
  let n;
  do n = 1 + Math.floor(rand() * total); while (avoid.includes(n));
  return n;
}

export function validateChallenge(c) {
  const errors = [];
  const total = c.grid.rows * c.grid.cols;
  if (!Number.isInteger(c.answer) || c.answer < 1 || c.answer > total)
    errors.push(`answer خاصو يكون بين 1 و ${total}`);
  const d = deltaE2000(c.baseColor, c.oddColor);
  if (d < MIN_FAIR_DELTA) errors.push(`الفرق ΔE=${d.toFixed(2)} صغير بزاف (الحد الأدنى ${MIN_FAIR_DELTA}) → التحدي غادي يكون شبه مستحيل`);
  if (d > MAX_DELTA) errors.push(`الفرق ΔE=${d.toFixed(2)} كبير بزاف (> ${MAX_DELTA}) → التحدي ساهل بزاف`);
  if (Math.abs(d - c.deltaE) > 0.05) errors.push(`deltaE المخزن (${c.deltaE}) ما كيطابقش الألوان (${d.toFixed(2)})`);
  return { ok: errors.length === 0, errors, deltaE: d };
}
