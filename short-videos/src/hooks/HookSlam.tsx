import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { SAFE_AREA } from '../../shared/safe-zones.js';
import { HOOK_CUES, beat } from '../../shared/timing.js';
import { clamp, pop, shake } from '../anim';
import { COLORS, FONT } from '../theme';
import type { Challenge } from '../types';

// النسخة A: العنوان كيتضرب كلمة بكلمة مع الإيقاع + اهتزاز + فلاش
export const HookSlam: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const frame = useCurrentFrame();
  const cue = HOOK_CUES.A;
  const [w1, w2, w3] = challenge.texts.hookA;
  const exitFrom = beat(cue.exit);
  const exit = interpolate(frame, [exitFrom, exitFrom + 13], [0, 1], clamp);
  const sh1 = shake(frame, beat(cue.word1), 6, 10);
  const sh3 = shake(frame, beat(cue.word3), 10, 22);
  const slam = (start: number) => {
    const s = pop(frame, start, 12, 260);
    return { opacity: frame < start ? 0 : Math.min(1, s * 2), transform: `scale(${2.4 - 1.4 * s})` };
  };
  const badge = pop(frame, beat(cue.badge) - 5, 10, 160); // ظاهر من أول فريم
  const eye = pop(frame, beat(4), 8, 200);
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${sh1.x + sh3.x}px, ${sh1.y + sh3.y}px) scale(${1 + exit * 0.35})`,
        filter: `blur(${exit * 14}px)`, opacity: 1 - exit,
      }}
    >
      <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', direction: 'rtl', fontFamily: FONT }}>
        <div style={{ marginTop: 300 - (1 - badge) * 200, opacity: badge, fontSize: 40, fontWeight: 800, color: '#111',
          background: COLORS.accent, padding: '10px 34px', borderRadius: 999, transform: `rotate(${-3 * badge}deg)` }}>
          {challenge.series}
        </div>
        <div style={{ marginTop: 150, fontSize: 190, fontWeight: 900, color: '#fff', lineHeight: 1.1, ...slam(beat(cue.word1)),
          textShadow: '0 10px 0 rgba(0,0,0,0.35)' }}>{w1}</div>
        <div style={{ marginTop: 10, fontSize: 130, fontWeight: 900, color: COLORS.accent3, lineHeight: 1.2, ...slam(beat(cue.word2)),
          textShadow: '0 8px 0 rgba(0,0,0,0.35)' }}>{w2}</div>
        <div style={{ marginTop: 30, fontSize: 92, fontWeight: 900, color: COLORS.accent, lineHeight: 1.3, ...slam(beat(cue.word3)),
          textShadow: '0 8px 0 rgba(0,0,0,0.35)', textAlign: 'center' }}>{w3}</div>
        <div style={{ marginTop: 40, fontSize: 140, opacity: eye, transform: `scale(${eye}) rotate(${Math.sin(frame / 4) * 8}deg)` }}>👀</div>
      </div>
    </AbsoluteFill>
  );
};
