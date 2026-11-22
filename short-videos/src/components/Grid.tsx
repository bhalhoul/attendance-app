import React from 'react';
import { interpolate, useCurrentFrame, Easing } from 'remotion';
import { LAYOUT, SAFE_AREA } from '../../shared/safe-zones.js';
import { SECTIONS } from '../../shared/timing.js';
import { beatPulse, clamp, pop } from '../anim';
import { COLORS, FONT } from '../theme';
import type { Challenge } from '../types';

type Props = {
  challenge: Challenge;
  enterAt: number; // بداية ظهور المربعات
  instant?: boolean; // الشبكة موجودة من البداية (النسخة B)
};

const GAP = 14;
const PAD = 18;

export const Grid: React.FC<Props> = ({ challenge, enterAt, instant }) => {
  const frame = useCurrentFrame();
  const { rows, cols } = challenge.grid;
  const size = LAYOUT.grid.size;
  const cell = (size - PAD * 2 - GAP * (cols - 1)) / cols;
  const revealAt = SECTIONS.reveal.from;
  const outroAt = SECTIONS.outro.from;

  // كشف الجواب
  const rv = pop(frame, revealAt, 9, 160);
  const dim = interpolate(frame, [revealAt, revealAt + 6], [1, 0.22], clamp);
  // فالنهاية: الشبكة كتصغر وكتنزل شوية باش تخلي البلاصة لنص المشاركة
  const o = interpolate(frame, [outroAt, outroAt + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const scale = 1 - 0.22 * o;
  const shiftY = 30 * o;
  // نبضة خفيفة وقت دعوة الكومنتير (الشبكة كاملة، ماشي مربع واحد → عادل)
  const breathe = frame >= SECTIONS.comment.from && frame < revealAt ? 1 + 0.012 * beatPulse(frame, 2) : 1;

  return (
    <div
      style={{
        position: 'absolute', width: size, height: size,
        left: SAFE_AREA.centerX - size / 2, top: LAYOUT.grid.top,
        transform: `translateY(${shiftY}px) scale(${scale * breathe})`,
        borderRadius: 40, background: COLORS.card,
        boxShadow: '0 30px 80px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.06)',
        opacity: instant ? 1 : interpolate(frame, [enterAt, enterAt + 4], [0, 1], clamp),
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const n = i + 1;
        const r = Math.floor(i / cols), c = i % cols;
        const isAnswer = n === challenge.answer;
        // دخول بموجة قطرية من الزاوية
        const s = instant ? 1 : pop(frame, enterAt + (r + c) * 1.2, 12, 220);
        const ans = isAnswer ? rv : 0;
        const ring = isAnswer ? interpolate(frame - revealAt, [0, 24], [0, 1], clamp) : 0;
        return (
          <div
            key={n}
            style={{
              position: 'absolute', width: cell, height: cell,
              left: PAD + c * (cell + GAP), top: PAD + r * (cell + GAP),
              borderRadius: 22,
              background: isAnswer ? challenge.oddColor : challenge.baseColor,
              transform: `scale(${s * (1 + 0.16 * ans)})`,
              opacity: frame >= revealAt && !isAnswer ? dim : 1,
              zIndex: isAnswer ? 2 : 1,
              boxShadow: isAnswer && frame >= revealAt
                ? `0 0 0 ${8 * ans}px #fff, 0 0 ${60 * ans}px rgba(255,255,255,0.8)`
                : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONT, fontWeight: 800, fontSize: 46, color: '#fff',
                textShadow: '0 3px 6px rgba(0,0,0,0.45)', direction: 'ltr',
              }}
            >
              {n}
            </span>
            {isAnswer && frame >= revealAt && (
              <div
                style={{
                  position: 'absolute', inset: -10 - 50 * ring, borderRadius: 30 + 20 * ring,
                  border: `6px solid rgba(255,210,63,${1 - ring})`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
