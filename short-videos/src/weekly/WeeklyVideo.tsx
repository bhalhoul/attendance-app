import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { LAYOUT, SAFE_AREA } from '../../shared/safe-zones.js';
import { slideTimes } from '../../shared/weekly-timing.js';
import { FPS } from '../../shared/timing.js';
import { beatPulse, clamp, fit, pop } from '../anim';
import { AnimatedText } from '../components/AnimatedText';
import { Background } from '../components/Background';
import { SafeZoneOverlay } from '../components/SafeZoneOverlay';
import { COLORS, FONT } from '../theme';

export type Slide = { text?: string; stat?: string; label?: string; question?: string };
export type Segment = { from: number; to: number; emoji: string; tag: string; color: string; title: string; slides: Slide[]; source: string };
export type Weekly = {
  id: string; brand: string; rangeLabel: string; durationSec: number; seed: number;
  intro: { from: number; to: number; title: string; teasers: string[] };
  segments: Segment[];
  outro: { from: number; to: number; recap: string; question: string; cta: string; follow: string };
};
export type WeeklyProps = { weekly: Weekly; showSafeZones: boolean };

const F = (s: number) => Math.round(s * FPS);
const Center: React.FC<{ top: number; height?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, height, children, style }) => (
  <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top, height,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...style }}>{children}</div>
);

const SlideView: React.FC<{ s: Slide & { start: number; end: number }; color: string }> = ({ s, color }) => {
  const frame = useCurrentFrame();
  const a = F(s.start), b = F(s.end);
  if (frame < a || frame >= b) return null;
  const inS = pop(frame, a, 11, 190);
  const out = interpolate(frame, [b - 8, b], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const wrap: React.CSSProperties = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    opacity: 1 - out, transform: `translateX(${-out * 120}px)` };
  if (s.stat) {
    return (
      <div style={wrap}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: fit(s.stat, 140, 7), color: '#fff', direction: /[\u0600-\u06FF]/.test(s.stat) ? 'rtl' : 'ltr', unicodeBidi: 'isolate', lineHeight: 1.15,
          transform: `scale(${0.6 + 0.4 * inS})`, opacity: Math.min(1, inS * 1.5), textShadow: `0 10px 0 ${color}` }}>{s.stat}</div>
        <div style={{ marginTop: 22, maxWidth: 760, textAlign: 'center' }}>
          <AnimatedText text={s.label!} start={a + 6} size={Math.max(44, fit(s.label!, 54, 32))} weight={700} stagger={2} />
        </div>
      </div>
    );
  }
  if (s.question) {
    return (
      <div style={wrap}>
        <div style={{ background: 'rgba(0,0,0,0.45)', border: `4px solid ${COLORS.accent}`, borderRadius: 34, padding: '30px 34px',
          transform: `scale(${0.85 + 0.15 * inS})`, opacity: Math.min(1, inS * 1.5), maxWidth: 800 }}>
          <AnimatedText text={s.question} start={a + 2} size={Math.max(56, fit(s.question, 72, 24))} color={COLORS.accent} stagger={3} />
        </div>
      </div>
    );
  }
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', direction: 'rtl', maxWidth: 800 }}>
        <div style={{ width: 12, alignSelf: 'stretch', borderRadius: 6, background: color, transform: `scaleY(${inS})`, transformOrigin: 'top' }} />
        <AnimatedText text={s.text!} start={a + 2} size={Math.max(56, fit(s.text!, 74, 26))} weight={800} stagger={2}
          style={{ justifyContent: 'flex-start', textAlign: 'right' }} />
      </div>
    </div>
  );
};

const SegmentView: React.FC<{ seg: Segment; index: number; count: number }> = ({ seg, index, count }) => {
  const frame = useCurrentFrame();
  const a = F(seg.from), b = F(seg.to);
  if (frame < a - 2 || frame >= b + 2) return null;
  const enter = interpolate(frame, [a, a + 12], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const exit = interpolate(frame, [b - 10, b], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const emo = pop(frame, a + 3, 9, 200);
  const p = beatPulse(frame);
  return (
    <AbsoluteFill style={{ transform: `translateX(${enter * 900 - exit * 900}px)` }}>
      <div style={{ position: 'absolute', left: SAFE_AREA.centerX - 380, top: 520, width: 760, height: 760, borderRadius: '50%',
        background: `radial-gradient(circle, ${seg.color}55 0%, transparent 65%)`, opacity: 0.7 + 0.3 * p }} />
      <Center top={400} height={130} style={{ flexDirection: 'row', gap: 22, direction: 'rtl' }}>
        <div style={{ width: 118, height: 118, borderRadius: 32, background: seg.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 70, transform: `scale(${emo})`, boxShadow: `0 14px 40px ${seg.color}88` }}>{seg.emoji}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#fff', background: seg.color, padding: '2px 20px', borderRadius: 999 }}>
            {seg.tag} · {index + 1}/{count}
          </div>
          <div style={{ maxWidth: 640 }}>
            <AnimatedText text={seg.title} start={a + 8} size={Math.max(46, fit(seg.title, 58, 22))} stagger={2} style={{ justifyContent: 'flex-start', textAlign: 'right' }} />
          </div>
        </div>
      </Center>
      <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 580, height: 680 }}>
        {(slideTimes(seg) as (Slide & { start: number; end: number })[]).map((s, i) => <SlideView key={i} s={s} color={seg.color} />)}
      </div>
      <Center top={1290} height={60}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, color: 'rgba(255,255,255,0.7)', direction: 'rtl',
          opacity: interpolate(frame, [a + 30, a + 45], [0, 1], clamp) }}>
          📰 المصادر: <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>{seg.source}</span>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

const Progress: React.FC<{ segs: Segment[] }> = ({ segs }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 10, width: '100%', direction: 'rtl' }}>
      {segs.map((s, i) => {
        const p = interpolate(frame, [F(s.from), F(s.to)], [0, 1], clamp);
        return (
          <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
            <div style={{ width: `${p * 100}%`, height: '100%', background: s.color, marginLeft: 'auto' }} />
          </div>
        );
      })}
    </div>
  );
};

const Ticker: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const shift = (frame * 3) % 1400;
  return (
    <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 1395, height: 54, overflow: 'hidden',
      background: 'rgba(0,0,0,0.45)', borderRadius: 14, borderRight: `8px solid ${COLORS.accent2}` }}>
      <div style={{ position: 'absolute', right: -1400 + shift, top: 6, whiteSpace: 'nowrap', direction: 'rtl', fontFamily: FONT, fontWeight: 700,
        fontSize: 28, color: '#fff' }}>{`${text}   •   `.repeat(8)}</div>
    </div>
  );
};

export const WeeklyVideo: React.FC<WeeklyProps> = ({ weekly, showSafeZones }) => {
  const frame = useCurrentFrame();
  const { intro, outro, segments } = weekly;
  const iEnd = F(intro.to), oStart = F(outro.from);
  const introOut = interpolate(frame, [iEnd - 12, iEnd], [1, 0], clamp);
  const logo = pop(frame, -4, 9, 160);
  const p = beatPulse(frame);
  const flash = interpolate(frame, [iEnd - 2, iEnd, iEnd + 6], [0, 0.6, 0], clamp);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Background />
      <Audio src={staticFile(`audio/${weekly.id}.wav`)} />

      {frame >= iEnd - 4 && (
        <Center top={LAYOUT.topBlock.top} height={120} style={{ gap: 14, opacity: interpolate(frame, [iEnd - 4, iEnd + 4], [0, 1], clamp) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, direction: 'rtl' }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#fff', background: COLORS.accent2, padding: '4px 22px', borderRadius: 10 }}>
              🗓️ {weekly.brand}
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: 'rgba(255,255,255,0.85)' }}>{weekly.rangeLabel}</div>
          </div>
          {frame < oStart + 6 && <Progress segs={segments} />}
        </Center>
      )}

      {/* المقدمة 0–15 ث */}
      {frame < iEnd + 2 && (
        <AbsoluteFill style={{ opacity: introOut, transform: `scale(${1 + (1 - introOut) * 0.15})` }}>
          <Center top={270} height={250}>
            <div style={{ fontSize: 90, transform: `scale(${logo * (1 + 0.05 * p)})` }}>🗓️</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 88, lineHeight: 1.3, color: '#fff', transform: `scale(${logo})`, textShadow: `0 8px 0 ${COLORS.accent2}` }}>{weekly.brand}</div>
          </Center>
          <Center top={545} height={70}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: '#111', background: COLORS.accent, padding: '6px 30px', borderRadius: 999,
              transform: `scale(${pop(frame, 15, 11, 200)})` }}>{weekly.rangeLabel}</div>
          </Center>
          <Center top={630} height={150}>
            <AnimatedText text={intro.title} start={30} size={54} highlight={['3']} highlightColor={COLORS.accent} />
          </Center>
          <Center top={800} height={480} style={{ gap: 14, alignItems: 'stretch' }}>
            {intro.teasers.map((t, i) => {
              const st = F(3 + i * 2);
              const s = pop(frame, st, 12, 200);
              return (
                <div key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 42, color: '#fff', direction: 'rtl', background: 'rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: '12px 26px', borderRight: `8px solid ${segments[i]?.color ?? COLORS.accent}`,
                  opacity: frame < st ? 0 : Math.min(1, s * 1.5), transform: `translateX(${(1 - s) * 120}px)` }}>{t}</div>
              );
            })}
          </Center>
        </AbsoluteFill>
      )}

      {segments.map((seg, i) => <SegmentView key={i} seg={seg} index={i} count={segments.length} />)}

      {/* الخاتمة 150–180 ث */}
      {frame >= oStart && (
        <AbsoluteFill style={{ opacity: interpolate(frame, [oStart, oStart + 10], [0, 1], clamp) }}>
          <Center top={420} height={120}>
            <AnimatedText text={outro.recap} start={oStart + 4} size={64} highlight={['عامرة']} highlightColor={COLORS.accent} />
          </Center>
          <Center top={560} height={150} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {segments.map((s, i) => {
              const sc = pop(frame, oStart + F(1.5) + i * 6, 11, 200);
              return <div key={i} style={{ width: 96, height: 96, borderRadius: 26, background: s.color, fontSize: 56, display: 'flex',
                alignItems: 'center', justifyContent: 'center', transform: `scale(${sc})` }}>{s.emoji}</div>;
            })}
          </Center>
          <Center top={740} height={300}>
            <AnimatedText text={outro.question} start={oStart + F(5)} size={60} highlight={['أكبر', 'تأثير']} highlightColor={COLORS.accent} />
          </Center>
          <Center top={1060} height={100}>
            <AnimatedText text={outro.cta} start={oStart + F(13)} size={52} color={COLORS.accent3} />
          </Center>
          <Center top={1180} height={110}>
            <AnimatedText text={outro.follow} start={oStart + F(18)} size={40} weight={700} />
          </Center>
        </AbsoluteFill>
      )}

      {frame >= iEnd && <Ticker text={`${weekly.brand} • ${weekly.rangeLabel} • ${segments.map((s) => s.emoji + ' ' + s.tag).join(' • ')}`} />}
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}
      {showSafeZones && <SafeZoneOverlay />}
    </AbsoluteFill>
  );
};
