import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { clamp, pop } from '../anim';
import { FONT } from '../theme';

type Props = {
  text: string;
  start: number; // فريم الظهور
  end?: number; // فريم الاختفاء
  size?: number;
  weight?: number;
  color?: string;
  stagger?: number; // فريمات بين الكلمات
  highlight?: string[]; // كلمات بلون مميز
  highlightColor?: string;
  style?: React.CSSProperties;
};

// نص عربي (RTL) كيدخل كلمة بكلمة بحركة spring وكيخرج بانزلاق للفوق.
export const AnimatedText: React.FC<Props> = ({
  text, start, end, size = 64, weight = 900, color = '#fff', stagger = 3,
  highlight = [], highlightColor = '#ffd23f', style,
}) => {
  const frame = useCurrentFrame();
  if (frame < start || (end !== undefined && frame >= end)) return null;
  // الإيموجي والعلامات بوحدهم كيتلصقو مع الكلمة اللي قبلهم باش ما يبقاوش فسطر بوحدهم
  const words = text.split(' ').reduce<string[]>((acc, w) => {
    if (acc.length && !/[\p{L}\p{N}]/u.test(w)) acc[acc.length - 1] += '\u00A0' + w;
    else acc.push(w);
    return acc;
  }, []);
  const out = end === undefined ? 1 : interpolate(frame, [end - 6, end], [1, 0], clamp);
  const outY = end === undefined ? 0 : interpolate(frame, [end - 6, end], [0, -36], clamp);
  return (
    <div
      style={{
        direction: 'rtl', display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        columnGap: size * 0.28, rowGap: 0, fontFamily: FONT, fontSize: size, fontWeight: weight,
        lineHeight: 1.35, color, textAlign: 'center', opacity: out,
        transform: `translateY(${outY}px)`, ...style,
      }}
    >
      {words.map((w, i) => {
        const s = pop(frame, start + i * stagger, 10, 200);
        const hl = highlight.some((h) => w.includes(h));
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translateY(${(1 - s) * 50}px) scale(${0.6 + 0.4 * s})`,
              opacity: Math.min(1, s * 1.5),
              color: hl ? highlightColor : undefined,
              textShadow: '0 6px 0 rgba(0,0,0,0.35), 0 0 30px rgba(0,0,0,0.45)',
              whiteSpace: 'nowrap',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
