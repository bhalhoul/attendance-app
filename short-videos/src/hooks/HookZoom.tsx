import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { SAFE_AREA } from '../../shared/safe-zones.js';
import { HOOK_CUES, beat } from '../../shared/timing.js';
import { clamp } from '../anim';
import { AnimatedText } from '../components/AnimatedText';
import { COLORS } from '../theme';
import type { Challenge } from '../types';

// النسخة B: الشبكة كتبان من أول فريم (مزوّمة وضبابية) والنص فوقها.
// التحويلات ديال الشبكة راه فـ ChallengeVideo (zoomGridStyle).
export const zoomGridStyle = (frame: number): React.CSSProperties => {
  const f = beat(HOOK_CUES.B.focus);
  const z = interpolate(frame, [0, f], [2.4, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const blur = interpolate(frame, [0, f], [18, 0], clamp);
  return { transform: `scale(${z})`, filter: blur > 0.01 ? `blur(${blur}px)` : undefined };
};

export const HookZoom: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const frame = useCurrentFrame();
  const cue = HOOK_CUES.B;
  const exitFrom = beat(cue.exit);
  const shade = interpolate(frame, [beat(cue.focus), beat(cue.focus) + 6, exitFrom + 4, exitFrom + 14], [0.35, 0.82, 0.82, 0], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(8,6,20,${frame < beat(cue.focus) ? 0.35 : shade})` }} />
      <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 820 }}>
        <AnimatedText text={challenge.texts.hookB} start={beat(cue.text) - 10} end={beat(cue.focus)} size={82}
          highlight={['5']} stagger={2} />
      </div>
      <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 760 }}>
        <AnimatedText text={challenge.texts.title} start={beat(cue.title)} end={exitFrom + 8} size={92}
          highlight={['مراتك', 'أقوى؟']} highlightColor={COLORS.accent} stagger={3} />
      </div>
    </AbsoluteFill>
  );
};
