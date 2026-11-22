// توقيت فيديو "أخبار الأسبوع" — كلشي بالثواني ف JSON، وهنا كنحسبو اللحظات (مشترك بين الصورة والصوت)
export const SLIDES_START = 2.0; // ثواني بعد بداية المقطع (العنوان كيبان قبل)
export const SLIDES_END_PAD = 0.3;
export function slideTimes(seg) {
  const a = seg.from + SLIDES_START, b = seg.to - SLIDES_END_PAD;
  const n = seg.slides.length, d = (b - a) / n;
  return seg.slides.map((s, i) => ({ ...s, start: a + i * d, end: a + (i + 1) * d }));
}
