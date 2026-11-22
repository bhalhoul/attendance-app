import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { beatPulse } from '../anim';
import { COLORS } from '../theme';

// خلفية متحركة: تدرج + دوائر ضوء كتنبض مع الإيقاع (بعيدة على الشبكة)
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const p = beatPulse(frame);
  const blob = (x: number, y: number, r: number, c: string, speed: number, phase: number) => (
    <div
      style={{
        position: 'absolute',
        left: x + Math.sin(frame / speed + phase) * 60 - r,
        top: y + Math.cos(frame / (speed * 1.3) + phase) * 80 - r,
        width: r * 2, height: r * 2, borderRadius: '50%',
        background: `radial-gradient(circle, ${c} 0%, transparent 70%)`,
        opacity: 0.35 + 0.25 * p,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COLORS.bgTop} 0%, ${COLORS.bgBottom} 100%)`, overflow: 'hidden' }}>
      {blob(120, 260, 420, '#7b3cff', 40, 0)}
      {blob(980, 1700, 480, '#ff2d7a', 45, 2)}
      {blob(900, 300, 300, '#00c2ff', 55, 4)}
      {/* نقاط خفيفة */}
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 2px, transparent 2px)',
          backgroundSize: '48px 48px',
          backgroundPosition: `0px ${(frame * 1.5) % 48}px`,
        }}
      />
    </AbsoluteFill>
  );
};
