// "أخبار الأسبوع" — مونتاج احترافي مبني على صوت المذيع (ElevenLabs)
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { SAFE_AREA } from '../../shared/safe-zones.js';
import { SafeZoneOverlay } from '../components/SafeZoneOverlay';
import { FONT } from '../theme';
import { clampX, FPS, useTime } from './kit';
import { ZC } from './layout';
import { AiScene, CeutaScene, CopScene, IntroScene, MideastScene, OutroScene, SummitScene, type Part } from './scenes';

type Word = { w: string; start: number; end: number };
type Phrase = { words: Word[]; start: number; end: number };
type TPart = Part & { audio: string; words: Word[]; phrases: Phrase[] };
export type Timeline = { id: string; durationSec: number; parts: TPart[] };
export type WeeklyProProps = { timeline: Timeline; rangeLabel: string; brand: string; withAudio: boolean; showSafeZones: boolean };

const META: Record<string, { color: string; tag: string; n?: string }> = {
  intro: { color: '#ff4f8b', tag: '' },
  summit: { color: '#1e88e5', tag: 'العالم', n: '01' },
  mideast: { color: '#e53935', tag: 'الشرق الأوسط', n: '02' },
  ai: { color: '#8e24aa', tag: 'الاقتصاد', n: '03' },
  ceuta: { color: '#ef6c00', tag: 'سبتة', n: '04' },
  cop: { color: '#2e7d32', tag: 'المناخ', n: '05' },
  outro: { color: '#ffb300', tag: '' },
};

// خلفية سينمائية: تدرج + توهج بلون الخبر + شبكة خفيفة + vignette + grain
const Cinematic: React.FC<{ color: string; seed: number }> = ({ color, seed }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(120% 80% at 50% 35%, #1b1640 0%, #0a0a18 60%, #050509 100%)' }}>
      <div style={{ position: 'absolute', left: 500 - 600 + Math.sin(frame / 70) * 80, top: 300 + Math.cos(frame / 90) * 60, width: 1200, height: 1200, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}55 0%, transparent 60%)` }} />
      <div style={{ position: 'absolute', left: -200, top: 1300 + Math.sin(frame / 50) * 50, width: 900, height: 900, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}33 0%, transparent 60%)` }} />
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)',
        backgroundSize: '60px 60px', backgroundPosition: `0 ${(frame * 0.6) % 60}px`, maskImage: 'radial-gradient(circle at 50% 40%, #000 20%, transparent 70%)' }} />
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'overlay' }}>
        <filter id={`g${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} /></filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, #000a 100%)' }} />
    </AbsoluteFill>
  );
};

// انتقال: دخول بزوم + blur، خروج بسحبة جانبية + blur، وخط ضوء
const SceneWrap: React.FC<{ p: TPart; children: React.ReactNode }> = ({ p, children }) => {
  const { t } = useTime();
  if (t < p.sceneStart - 0.05 || t > p.sceneEnd + 0.4) return null;
  const inK = interpolate(t, [p.sceneStart, p.sceneStart + 0.45], [0, 1], clampX);
  const outK = interpolate(t, [p.sceneEnd - 0.35, p.sceneEnd + 0.1], [0, 1], clampX);
  const blur = (1 - inK) * 18 + outK * 22;
  return (
    <AbsoluteFill style={{ opacity: Math.min(inK * 1.4, 1 - outK), filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      transform: `scale(${1.08 - 0.08 * inK}) translateX(${-outK * 200}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

const LightSweep: React.FC<{ at: number }> = ({ at }) => {
  const { t } = useTime();
  const k = interpolate(t, [at - 0.25, at + 0.25], [0, 1], clampX);
  if (k <= 0 || k >= 1) return null;
  return <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${k * 140 - 40}%, #ffffffaa ${k * 140 - 20}%, transparent ${k * 140}%)`, mixBlendMode: 'screen' }} />;
};

// الشارة الفوقانية: اسم البرنامج + رقم الخبر والتصنيف
const Kicker: React.FC<{ p: TPart; brand: string; range: string }> = ({ p, brand, range }) => {
  const { t, sp } = useTime();
  const m = META[p.key];
  const s = sp(p.sceneStart + 0.2, 13, 170);
  return (
    <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 268, display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: '#ff1744', boxShadow: `0 0 ${10 + 8 * Math.abs(Math.sin(t * 4))}px #ff1744` }} />
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 32, color: '#fff', whiteSpace: 'nowrap' }}>{brand}</div>

      </div>
      {m.n && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, transform: `translateX(${(1 - s) * -200}px)`, opacity: s }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#fff', background: m.color, padding: '2px 18px', borderRadius: 10, whiteSpace: 'nowrap' }}>{m.tag}</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: m.color, direction: 'ltr' }}>{m.n}<span style={{ color: '#ffffff55', fontSize: 24 }}>/05</span></div>
        </div>
      )}
    </div>
  );
};

// ترجمة متزامنة كلمة بكلمة مع صوت المذيع
const Captions: React.FC<{ parts: TPart[] }> = ({ parts }) => {
  const { t } = useTime();
  let cur: { ph: Phrase; color: string } | null = null;
  for (const p of parts) for (const ph of p.phrases) if (t >= ph.start - 0.08 && t <= ph.end + 0.25) cur = { ph, color: META[p.key].color };
  if (!cur) return null;
  const { ph, color } = cur;
  const k = interpolate(t, [ph.start - 0.08, ph.start + 0.1], [0, 1], clampX);
  const o = interpolate(t, [ph.end + 0.1, ph.end + 0.25], [1, 0], clampX);
  return (
    <div style={{ position: 'absolute', left: ZC.left, width: ZC.w, top: ZC.top, height: ZC.h, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', direction: 'rtl', columnGap: 10, rowGap: 8, maxWidth: ZC.w,
        opacity: k * o, transform: `translateY(${(1 - k) * 30}px) scale(${0.94 + 0.06 * k})` }}>
        {ph.words.map((w, i) => {
          const active = t >= w.start - 0.02 && t < w.end + 0.05;
          const said = t >= w.end;
          return (
            <span key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 56, lineHeight: 1.3, padding: '0 10px', borderRadius: 12, whiteSpace: 'nowrap',
              color: active ? '#fff' : said ? '#fff' : '#ffffff88', background: active ? color : 'transparent',
              transform: `scale(${active ? 1.05 : 1})`, boxShadow: active ? `0 8px 30px ${color}88` : 'none',
              textShadow: active ? 'none' : '0 4px 18px #000, 0 2px 0 #000' }}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
};

export const WeeklyPro: React.FC<WeeklyProProps> = ({ timeline, rangeLabel, brand, withAudio, showSafeZones }) => {
  const { t } = useTime();
  const parts = timeline.parts;
  const cur = parts.find((p) => t >= p.sceneStart && t < p.sceneEnd) ?? parts[parts.length - 1];
  const byKey = Object.fromEntries(parts.map((p) => [p.key, p])) as Record<string, TPart>;
  const colors = ['summit', 'mideast', 'ai', 'ceuta', 'cop'].map((k) => META[k].color);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: '#050509' }}>
      <Cinematic color={META[cur.key].color} seed={1} />
      {withAudio && parts.map((p) => (
        <Sequence key={p.key} from={Math.round(p.start * FPS)}><Audio src={staticFile(p.audio)} /></Sequence>
      ))}
      <SceneWrap p={byKey.intro}><IntroScene p={byKey.intro} range={rangeLabel} color={META.intro.color} /></SceneWrap>
      <SceneWrap p={byKey.summit}><SummitScene p={byKey.summit} color={META.summit.color} /></SceneWrap>
      <SceneWrap p={byKey.mideast}><MideastScene p={byKey.mideast} color={META.mideast.color} /></SceneWrap>
      <SceneWrap p={byKey.ai}><AiScene p={byKey.ai} color={META.ai.color} /></SceneWrap>
      <SceneWrap p={byKey.ceuta}><CeutaScene p={byKey.ceuta} color={META.ceuta.color} /></SceneWrap>
      <SceneWrap p={byKey.cop}><CopScene p={byKey.cop} color={META.cop.color} /></SceneWrap>
      <SceneWrap p={byKey.outro}><OutroScene p={byKey.outro} color={META.outro.color} colors={colors} /></SceneWrap>
      {parts.slice(1).map((p) => <LightSweep key={p.key} at={p.sceneStart} />)}
      <Kicker p={cur} brand={brand} range={rangeLabel} />
      <Captions parts={parts} />
      {showSafeZones && <SafeZoneOverlay />}
    </AbsoluteFill>
  );
};
