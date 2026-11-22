// الإيقاع الزمني المشترك بين الفيديو (Remotion) والصوت (scripts/generate-audio.mjs).
// كل الحركات مبنية على الضربات (beats) باش تكون متزامنة مع الموسيقى.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const BPM = 120; // ضربة كل 0.5 ثانية = 15 فريم
export const DURATION_SECONDS = 30;
export const DURATION_FRAMES = FPS * DURATION_SECONDS; // 900

export const FRAMES_PER_BEAT = (FPS * 60) / BPM; // 15
export const beat = (n) => Math.round(n * FRAMES_PER_BEAT);
export const beatSec = (n) => (n * 60) / BPM;

// المقاطع (بالفريم). كل حد = ضربة كاملة.
export const SECTIONS = {
  hook: { from: 0, to: beat(8) }, //          0 → 4s   جذب الانتباه (يختلف حسب النسخة)
  intro: { from: beat(8), to: beat(12) }, //  4 → 6s   ظهور الشبكة + قراءة التعليمة
  countdown: { from: beat(12), to: beat(32) }, // 6 → 16s  عد تنازلي 10 → 1
  comment: { from: beat(32), to: beat(40) }, // 16 → 20s دعوة لكتابة الرقم
  reveal: { from: beat(40), to: beat(50) }, //  20 → 25s كشف الجواب + معلومة
  outro: { from: beat(50), to: beat(60) }, //   25 → 30s دعوة للمشاركة
};

export const COUNTDOWN_FROM = 10;
// فريم ظهور كل رقم: كل ثانية (ضربتين) رقم جديد
export const countdownFrame = (i) => SECTIONS.countdown.from + i * beat(2);
// نص التشجيع ف النص الثاني ديال العد
export const MID_HINT_AT = countdownFrame(5);

export const VARIANTS = ['A', 'B', 'C'];
export const VARIANT_INFO = {
  A: { slug: 'slam', label: 'A — العنوان الصادم (Title Slam)' },
  B: { slug: 'zoom', label: 'B — الشبكة من أول ثانية (Instant Zoom)' },
  C: { slug: 'versus', label: 'C — المواجهة (Versus)' },
};

// لحظات الحركة فـ"الهوك" لكل نسخة (بالضربات) — الصوت والصورة كيقراو من نفس المكان.
export const HOOK_CUES = {
  A: { badge: 0, word1: 2, word2: 3, word3: 4, eye: 5, exit: 7 },
  B: { text: 0, focus: 3, title: 3, exit: 7 },
  C: { right: 0, left: 2, vs: 3, question: 5, exit: 7 },
};
