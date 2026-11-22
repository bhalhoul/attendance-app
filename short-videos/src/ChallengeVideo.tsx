import React from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { LAYOUT, SAFE_AREA } from '../shared/safe-zones.js';
import { SECTIONS, beat } from '../shared/timing.js';
import { beatPulse, clamp, pop } from './anim';
import { AnimatedText } from './components/AnimatedText';
import { Background } from './components/Background';
import { Countdown } from './components/Countdown';
import { Grid } from './components/Grid';
import { Pill } from './components/Pill';
import { SafeZoneOverlay } from './components/SafeZoneOverlay';
import { HookSlam } from './hooks/HookSlam';
import { HookVersus } from './hooks/HookVersus';
import { HookZoom, zoomGridStyle } from './hooks/HookZoom';
import { COLORS, FONT } from './theme';
import type { VideoProps } from './types';

const S = SECTIONS;

const Block: React.FC<{ top: number; height: number; children: React.ReactNode }> = ({ top, height, children }) => (
  <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top, height,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
    {children}
  </div>
);

export const ChallengeVideo: React.FC<VideoProps> = ({ challenge, variant, showSafeZones }) => {
  const frame = useCurrentFrame();
  const t = challenge.texts;
  const instant = variant === 'B';
  const gridVisible = instant || frame >= S.intro.from;

  // فلاشات الانتقال
  const flash =
    (variant === 'A' ? interpolate(frame, [S.intro.from - 3, S.intro.from, S.intro.from + 6], [0, 0.85, 0], clamp) : 0) +
    interpolate(frame, [S.reveal.from, S.reveal.from + 8], [0.55, 0], clamp) * (frame >= S.reveal.from ? 1 : 0);

  const answerPop = pop(frame, S.reveal.from + 2, 8, 220);
  const p = beatPulse(frame);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Background />
      <Audio src={staticFile(`audio/${challenge.id}-${variant}.wav`)} />

      {gridVisible && (
        <AbsoluteFill style={instant && frame < S.intro.from ? zoomGridStyle(frame) : undefined}>
          <Grid challenge={challenge} enterAt={S.intro.from} instant={instant} />
        </AbsoluteFill>
      )}

      {/* ===== الكتلة العليا ===== */}
      <Block top={LAYOUT.topBlock.top} height={LAYOUT.topBlock.height}>
        <Pill text={challenge.series} start={S.intro.from} end={S.outro.from} size={30} bg={COLORS.accent} color="#111" />
        <div style={{ position: 'relative', width: '100%', height: 220 }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatedText text={t.instruction} start={S.intro.from + 2} end={S.comment.from} size={64}
              highlight={['مختلف…']} highlightColor={COLORS.accent3} />
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${1 + 0.035 * p * (frame >= S.comment.from && frame < S.reveal.from ? 1 : 0)})` }}>
            <AnimatedText text={t.commentPrompt} start={S.comment.from} end={S.reveal.from} size={62}
              highlight={['الرقم']} highlightColor={COLORS.accent} />
          </div>
          {frame >= S.reveal.from && frame < S.outro.from && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 28, direction: 'rtl', opacity: interpolate(frame, [S.outro.from - 6, S.outro.from], [1, 0], clamp) }}>
              <AnimatedText text={t.revealLabel} start={S.reveal.from} size={62} />
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 150, color: COLORS.accent, direction: 'ltr', lineHeight: 1,
                transform: `scale(${answerPop}) rotate(${(1 - answerPop) * 20}deg)`, textShadow: '0 10px 0 rgba(0,0,0,0.35)' }}>
                {challenge.answer}
                <span style={{ fontSize: 90, marginLeft: 14 }}>✅</span>
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <AnimatedText text={t.shareLine1} start={S.outro.from + 2} size={56} highlight={['لمراتك', 'لراجلك']} highlightColor={COLORS.accent2} />
            <AnimatedText text={t.shareLine2} start={S.outro.from + beat(1)} size={40} weight={800} highlight={['لصاحبك…']} highlightColor={COLORS.accent3} />
          </div>
        </div>
      </Block>

      {/* ===== الكتلة السفلى ===== */}
      <Block top={LAYOUT.bottomBlock.top} height={LAYOUT.bottomBlock.height}>
        <div style={{ position: 'absolute' }}><Countdown label={t.countdownLabel} /></div>
        <div style={{ position: 'absolute' }}><Pill text={t.commentSub} start={S.comment.from + beat(1)} end={S.reveal.from} size={40} /></div>
        <div style={{ position: 'absolute' }}><Pill text={t.revealSub} start={S.reveal.from + beat(2)} end={S.outro.from} size={32} /></div>
        <div style={{ position: 'absolute' }}>
          <Pill text={challenge.series} start={S.outro.from + beat(2)} end={S.outro.to + 10} size={40} bg={COLORS.accent} color="#111" />
        </div>
      </Block>

      {/* ===== الهوك (يختلف حسب النسخة) ===== */}
      {frame < S.intro.from + 2 && (
        variant === 'A' ? <HookSlam challenge={challenge} /> :
        variant === 'B' ? <HookZoom challenge={challenge} /> :
        <HookVersus challenge={challenge} />
      )}

      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}
      {showSafeZones && <SafeZoneOverlay />}
    </AbsoluteFill>
  );
};
