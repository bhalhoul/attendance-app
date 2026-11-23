// نظام المناطق: كل منطقة عندها بلاصتها، وحتى عنصر ما يقدر يدخل ف الآخر.
//  A = إطار الصورة (90..910 × 340..840) — المحتوى كيتقطع داخل الإطار
//  B = منطقة العنوان (868..1108) — عنصر واحد ف كل مرة
//  C = الترجمة (1140..1410) — ف WeeklyPro
import React from 'react';
import { interpolate } from 'remotion';
import { FONT } from '../theme';
import { clampX, useTime } from './kit';

export const ZA = { left: 90, top: 340, w: 820, h: 500 };
export const ZB = { left: 90, top: 868, w: 820, h: 240 };
export const ZC = { left: 100, top: 1140, w: 800, h: 270 };

export const fitSize = (text: string, base: number, maxChars: number, min = 28) =>
  Math.max(min, Math.round(base * Math.min(1, maxChars / Math.max(1, [...text].length))));

export const ZoneA: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div style={{ position: 'absolute', left: ZA.left, top: ZA.top, width: ZA.w, height: ZA.h, borderRadius: 40, overflow: 'hidden',
    background: `linear-gradient(160deg, #ffffff10, #ffffff04), radial-gradient(circle at 50% 30%, ${color}30, transparent 70%)`,
    boxShadow: `0 30px 80px #0008, inset 0 0 0 2px #ffffff1c, inset 0 0 0 1px ${color}40` }}>
    {children}
  </div>
);

// مجموعة داخل A: كتبان بين from و to، بانتقال ناعم (المجموعات ما كيتلاقاوش)
export const Group: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const { t } = useTime();
  if (t < from - 0.02 || t > to + 0.02) return null;
  const i = from <= 0.01 ? 1 : interpolate(t, [from, from + 0.35], [0, 1], clampX);
  const o = interpolate(t, [to - 0.25, to], [1, 0], clampX);
  const k = Math.min(i, o);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: k, transform: `scale(${1.06 - 0.06 * i})`, filter: k < 0.99 ? `blur(${(1 - k) * 10}px)` : undefined }}>
      {children}
    </div>
  );
};

export type BItem = { at: number; node: React.ReactNode };
// منطقة B: كيبان غير آخر عنصر. القديم كيختفي ف 0.15 ث قبل ما يبان الجديد.
export const ZoneB: React.FC<{ items: BItem[]; until: number }> = ({ items, until }) => {
  const { t, sp } = useTime();
  if (t > until) return null;
  const sorted = [...items].sort((a, b) => a.at - b.at);
  let idx = -1;
  for (let i = 0; i < sorted.length; i++) if (t >= sorted[i].at || (i === 0 && sorted[0].at <= 0.5)) idx = i;
  const prevIdx = idx >= 0 && t < sorted[idx].at + 0.15 ? idx - 1 : -1;
  const render = (i: number, mode: 'in' | 'out') => {
    const it = sorted[i];
    if (mode === 'out') {
      const k = interpolate(t, [sorted[i + 1].at, sorted[i + 1].at + 0.15], [1, 0], clampX);
      return <div key={`o${i}`} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: k, transform: `translateY(${(1 - k) * -40}px)` }}>{it.node}</div>;
    }
    const s = it.at <= 0.5 && i === 0 ? 1 : sp(it.at + 0.15, 13, 190);
    const endFade = interpolate(t, [until - 0.3, until], [1, 0], clampX);
    return <div key={`i${i}`} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: Math.min(1, s * 1.6) * endFade, transform: `translateY(${(1 - s) * 60}px) scale(${0.9 + 0.1 * s})` }}>{it.node}</div>;
  };
  return (
    <div style={{ position: 'absolute', left: ZB.left, top: ZB.top, width: ZB.w, height: ZB.h }}>
      {prevIdx >= 0 && render(prevIdx, 'out')}
      {idx >= 0 && (t >= sorted[idx].at + 0.15 || (idx === 0 && sorted[0].at <= 0.5)) && render(idx, 'in')}
    </div>
  );
};

export const BChip: React.FC<{ text: string; color: string; textColor?: string }> = ({ text, color, textColor = '#fff' }) => (
  <div style={{ maxWidth: ZB.w, fontFamily: FONT, fontWeight: 800, fontSize: fitSize(text, 50, 26, 34), color: textColor, direction: 'rtl', whiteSpace: 'nowrap',
    background: `linear-gradient(135deg, ${color}f2, ${color}aa)`, padding: '14px 36px', borderRadius: 26,
    boxShadow: `0 16px 44px ${color}55, inset 0 0 0 2px #ffffff26` }}>{text}</div>
);

export const BStat: React.FC<{ value: string; label: string; color: string }> = ({ value, label, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: fitSize(value, 130, 7, 80), color: '#fff', direction: /[؀-ۿ]/.test(value) ? 'rtl' : 'ltr',
      lineHeight: 1, textShadow: `0 8px 40px ${color}, 0 6px 0 #0007`, whiteSpace: 'nowrap' }}>{value}</div>
    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: fitSize(label, 40, 30, 30), color: '#ffffffd0', direction: 'rtl', whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);
