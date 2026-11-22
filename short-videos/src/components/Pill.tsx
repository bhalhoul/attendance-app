import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { clamp, pop } from '../anim';
import { FONT } from '../theme';

export const Pill: React.FC<{
  text: string; start: number; end: number; size?: number; bg?: string; color?: string; maxWidth?: number;
}> = ({ text, start, end, size = 36, bg = 'rgba(255,255,255,0.12)', color = '#fff', maxWidth = 800 }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const s = pop(frame, start, 11, 200);
  const out = interpolate(frame, [end - 6, end], [1, 0], clamp);
  return (
    <div
      style={{
        direction: 'rtl', fontFamily: FONT, fontWeight: 800, fontSize: size, color,
        background: bg, padding: `${size * 0.3}px ${size * 0.8}px`, borderRadius: 999,
        border: '2px solid rgba(255,255,255,0.18)', maxWidth, textAlign: 'center', lineHeight: 1.35,
        transform: `scale(${0.8 + 0.2 * s})`, opacity: Math.min(s * 1.4, out),
      }}
    >
      {text}
    </div>
  );
};
