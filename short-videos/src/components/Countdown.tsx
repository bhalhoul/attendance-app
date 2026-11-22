import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COUNTDOWN_FROM, SECTIONS, countdownFrame, beat } from '../../shared/timing.js';
import { clamp, pop } from '../anim';
import { COLORS, FONT } from '../theme';

// عد تنازلي 5 → 1، كل رقم كيضرب مع الإيقاع (كل ضربتين = ثانية)
export const Countdown: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const { from, to } = SECTIONS.countdown;
  if (frame < from || frame >= to + 4) return null;
  const idx = Math.min(COUNTDOWN_FROM - 1, Math.floor((frame - from) / beat(2)));
  const n = COUNTDOWN_FROM - idx;
  const s = pop(frame, countdownFrame(idx), 8, 260);
  const progress = interpolate(frame, [from, to], [0, 1], clamp);
  const R = 52, C = 2 * Math.PI * R;
  const urgent = n <= 3;
  const color = urgent ? COLORS.accent2 : COLORS.accent;
  const exit = interpolate(frame, [to, to + 4], [1, 0], clamp);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, direction: 'rtl', opacity: exit }}>
      <div style={{ position: 'relative', width: 124, height: 124, transform: `scale(${0.7 + 0.3 * s})` }}>
        <svg width={124} height={124} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={62} cy={62} r={R} stroke="rgba(255,255,255,0.15)" strokeWidth={10} fill="rgba(0,0,0,0.35)" />
          <circle cx={62} cy={62} r={R} stroke={color} strokeWidth={10} fill="none"
            strokeDasharray={C} strokeDashoffset={C * progress} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT, fontWeight: 900, fontSize: 70, color, lineHeight: 1 }}>
          {n}
        </div>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: '#fff' }}>{label}</div>
    </div>
  );
};
