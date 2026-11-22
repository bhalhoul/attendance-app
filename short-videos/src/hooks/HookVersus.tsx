import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { SAFE_AREA } from '../../shared/safe-zones.js';
import { HOOK_CUES, beat } from '../../shared/timing.js';
import { clamp, fit, pop, shake } from '../anim';
import { COLORS, FONT } from '../theme';
import type { Challenge } from '../types';

// النسخة C: مواجهة بين طرفين (يمين ضد يسار) — شاشة مقسومة + VS
export const HookVersus: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const frame = useCurrentFrame();
  const cue = HOOK_CUES.C;
  const t = challenge.texts;
  const exitFrom = beat(cue.exit);
  const ease = { ...clamp, easing: Easing.out(Easing.cubic) };
  const inR = interpolate(frame, [beat(cue.right) - 5, beat(cue.right) + 6], [600, 0], ease);
  const inL = interpolate(frame, [beat(cue.left), beat(cue.left) + 8], [-600, 0], ease);
  const out = interpolate(frame, [exitFrom, exitFrom + 13], [0, 620], { ...clamp, easing: Easing.in(Easing.cubic) });
  const vs = pop(frame, beat(cue.vs), 8, 260);
  const q = pop(frame, beat(cue.question), 10, 200);
  const sh = shake(frame, beat(cue.vs), 10, 20);
  const half = (side: 'R' | 'L') => {
    const isR = side === 'R';
    const x = isR ? inR + out : inL - out;
    const visible = isR || frame >= beat(cue.left);
    return (
      <div style={{
        position: 'absolute', top: 0, bottom: 0, width: 560, [isR ? 'right' : 'left']: -10,
        transform: `translateX(${x}px) skewX(${isR ? -4 : -4}deg)`, opacity: visible ? 1 : 0,
        background: isR ? 'linear-gradient(160deg, #1f6bff, #0b2a7a)' : 'linear-gradient(200deg, #ff3d8b, #7a0b3f)',
        boxShadow: '0 0 60px rgba(0,0,0,0.5)',
      }} />
    );
  };
  const label = (text: string, cx: number, start: number) => {
    const s = pop(frame, start, 10, 220);
    return (
      <div style={{ position: 'absolute', left: cx - 230, width: 460, top: 560, whiteSpace: 'nowrap', textAlign: 'center', direction: 'rtl',
        fontFamily: FONT, fontWeight: 900, fontSize: fit(text, 88, 7), color: '#fff', opacity: frame < start ? 0 : 1,
        transform: `scale(${0.5 + 0.5 * s}) translateX(${frame >= exitFrom ? (cx > 540 ? out : -out) : 0}px)`,
        textShadow: '0 8px 0 rgba(0,0,0,0.3)' }}>{text}</div>
    );
  };
  return (
    <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      {half('R')}
      {half('L')}
      {label(t.hookCRight, 710, beat(cue.right))}
      {label(t.hookCLeft, 300, beat(cue.left) + 3)}
      <div style={{ position: 'absolute', left: SAFE_AREA.centerX - 110, top: 820, width: 220, height: 220, borderRadius: '50%',
        background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontWeight: 900, fontSize: 110, color: '#111', direction: 'ltr',
        opacity: frame < beat(cue.vs) ? 0 : 1 - out / 620,
        transform: `scale(${3 - 2 * vs}) rotate(${(1 - vs) * -40}deg)`, boxShadow: '0 0 0 10px #111, 0 0 80px rgba(255,210,63,0.7)' }}>
        VS
      </div>
      <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 1150, display: 'flex', justifyContent: 'center',
        opacity: frame < beat(cue.question) ? 0 : 1 - out / 620 }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: fit(t.hookCQuestion, 62, 22), whiteSpace: 'nowrap', color: '#fff', direction: 'rtl', background: 'rgba(10,10,25,0.85)',
          padding: '14px 44px', borderRadius: 30, transform: `scale(${0.6 + 0.4 * q})`, border: `4px solid ${COLORS.accent}` }}>
          {t.hookCQuestion}
        </div>
      </div>
      <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 300, display: 'flex', justifyContent: 'center',
        opacity: 1 - out / 620 }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#111', background: '#fff', padding: '10px 34px',
          borderRadius: 999, direction: 'rtl' }}>{challenge.series}</div>
      </div>
    </AbsoluteFill>
  );
};
