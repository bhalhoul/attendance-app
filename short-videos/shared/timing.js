// الإيقاع الزمني المشترك بين الفيديو (Remotion) والصوت (scripts/generate-audio.mjs).
// كل الحركات مبنية على الضربات (beats) باش تكون متزامنة مع الموسيقى.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const BPM = 120; // ضربة كل 0.5 ثانية = 15 فريم
export const DURATION_SECONDS = 18;
export const DURATION_FRAMES = FPS * DURATION_SECONDS; // 540

export const FRAMES_PER_BEAT = (FPS * 60) / BPM; // 15
export const beat = (n) => Math.round(n * FRAMES_PER_BEAT);
export const beatSec = (n) => (n * 60) / BPM;

// المقاطع (بالفريم). كل حد = ضربة كاملة.
export const SECTIONS = {
  hook: { from: 0, to: beat(6) }, //        0.0s → 3.0s  جذب الانتباه (يختلف حسب النسخة)
  intro: { from: beat(6), to: beat(8) }, // 3.0s → 4.0s  ظهور الشبكة + التعليمة
  countdown: { from: beat(8), to: beat(18) }, // 4.0s → 9.0s  العد 5 → 1
  comment: { from: beat(18), to: beat(24) }, // 9.0s → 12.0s دعوة لكتابة الرقم
  reveal: { from: beat(24), to: beat(30) }, // 12.0s → 15.0s كشف الجواب
  outro: { from: beat(30), to: beat(36) }, // 15.0s → 18.0s دعوة للمشاركة
};

export const COUNTDOWN_FROM = 5;
// فريم ظهور كل رقم: 5 عند 4.0s، 4 عند 5.0s ... 1 عند 8.0s
export const countdownFrame = (i) => SECTIONS.countdown.from + i * beat(2);

export const VARIANTS = ['A', 'B', 'C'];
export const VARIANT_INFO = {
  A: { slug: 'slam', label: 'A — العنوان الصادم (Title Slam)' },
  B: { slug: 'zoom', label: 'B — الشبكة من أول ثانية (Instant Zoom)' },
  C: { slug: 'versus', label: 'C — المواجهة (Versus)' },
};

// لحظات الحركة فـ"الهوك" لكل نسخة (بالضربات) — الصوت والصورة كيقراو من نفس المكان.
export const HOOK_CUES = {
  A: { badge: 0, word1: 1, word2: 2, word3: 3, exit: 5 },
  B: { text: 0, focus: 2, title: 2, exit: 5 },
  C: { you: 0, partner: 1, vs: 2, question: 4, exit: 5 },
};
