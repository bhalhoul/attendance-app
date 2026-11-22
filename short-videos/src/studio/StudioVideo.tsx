// استوديو الأخبار — قالب واحد لكل الأشكال (الخبر الأهم / اليوم في دقيقة / خبر سريع)
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion';
import { SAFE_AREA } from '../../shared/safe-zones.js';
import { SafeZoneOverlay } from '../components/SafeZoneOverlay';
import { FONT } from '../theme';
import { clampX, Emoji, FPS, useTime } from '../weeklypro/kit';
import { BChip, BStat, Group, ZC, ZoneA, ZoneB } from '../weeklypro/layout';
import { Cinematic, LightSweep, SceneWrap } from '../weeklypro/WeeklyPro';
import { RenderBlock, type Block } from './blocks';

type Word = { w: string; start: number; end: number };
type Phrase = { words: Word[]; start: number; end: number };
type Head = { at: number; chip?: string; stat?: string; label?: string; color?: string; textColor?: string };
export type SPart = { key: string; color: string; tag?: string; text: string; visuals: Block[]; heads: Head[]; audio: string;
  start: number; end: number; sceneStart: number; sceneEnd: number; words: Word[]; phrases: Phrase[] };
export type Brand = { name: string; latin: string; handle: string; tagline: string; colors: { primary: string; accent: string };
  formats: Record<string, { label: string; icon: string; color: string }> };
export type StudioTimeline = { id: string; format: string; dateLabel: string; brand: Brand; durationSec: number; parts: SPart[] };
export type StudioProps = { tl: StudioTimeline; withAudio: boolean; showSafeZones: boolean };

const ENDCARD = 2.2; // ثواني ديال بطاقة النهاية (اللوغو)

// اللوغو: مربع أحمر فيه "ب" + نقطة ذهبية (كيتبدل من brand.json: الاسم والألوان)
export const Logo: React.FC<{ brand: Brand; size: number }> = ({ brand, size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(145deg, ${brand.colors.primary}, #8e1b18)`, position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 ${size * 0.12}px ${size * 0.4}px ${brand.colors.primary}66, inset 0 0 0 ${Math.max(1, size * 0.04)}px #ffffff30` }}>
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.62, color: '#fff', lineHeight: 1, marginTop: -size * 0.08 }}>{[...brand.name][0]}</div>
    <div style={{ position: 'absolute', left: size * 0.16, top: size * 0.16, width: size * 0.18, height: size * 0.18, borderRadius: '50%', background: brand.colors.accent }} />
  </div>
);

// الشارة الفوقانية = العلامة المائية الدائمة (لوغو + اسم + @حساب) + شكل الفيديو/رقم الخبر
const Kicker: React.FC<{ tl: StudioTimeline; p: SPart }> = ({ tl, p }) => {
  const { t, sp } = useTime();
  const f = tl.brand.formats[tl.format];
  const stories = tl.parts.filter((x) => x.tag);
  const idx = stories.findIndex((x) => x.key === p.key);
  const s = sp(p.sceneStart + 0.2, 13, 170);
  return (
    <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 258, height: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Logo brand={tl.brand} size={58} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 32, color: '#fff', whiteSpace: 'nowrap' }}>{tl.brand.name}</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#ffffff99', direction: 'ltr', textAlign: 'right' }}>{tl.brand.handle}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: s, transform: `translateX(${(1 - s) * -120}px)` }}>
        {p.tag && (tl.format === 'minute' || tl.format === 'results') ? (
          <>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#fff', background: p.color, padding: '2px 16px', borderRadius: 10, whiteSpace: 'nowrap' }}>{p.tag}</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 32, color: '#fff', direction: 'ltr' }}>{idx + 1}<span style={{ color: '#ffffff55', fontSize: 22 }}>/{stories.length}</span></div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontWeight: 900, fontSize: 28, color: tl.format === 'quick' ? '#111' : '#fff',
            background: f.color, padding: '4px 18px', borderRadius: 12, whiteSpace: 'nowrap', boxShadow: `0 0 ${tl.format === 'quick' ? 10 + 10 * Math.abs(Math.sin(t * 5)) : 0}px ${f.color}` }}>
            <span style={{ fontFamily: "'Noto Color Emoji'", fontSize: 24 }}>{f.icon}</span>{f.label}
          </div>
        )}
      </div>
    </div>
  );
};

const Captions: React.FC<{ parts: SPart[] }> = ({ parts }) => {
  const { t } = useTime();
  let cur: { ph: Phrase; color: string } | null = null;
  for (const p of parts) for (const ph of p.phrases) if (t >= ph.start - 0.08 && t <= ph.end + 0.25) cur = { ph, color: p.color };
  if (!cur) return null;
  const { ph, color } = cur;
  const k = interpolate(t, [ph.start - 0.08, ph.start + 0.1], [0, 1], clampX);
  const o = interpolate(t, [ph.end + 0.1, ph.end + 0.25], [1, 0], clampX);
  return (
    <div style={{ position: 'absolute', left: ZC.left, width: ZC.w, top: ZC.top, height: ZC.h, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', direction: 'rtl', columnGap: 10, rowGap: 8, maxWidth: ZC.w, opacity: k * o, transform: `translateY(${(1 - k) * 30}px)` }}>
        {ph.words.map((w, i) => {
          const active = t >= w.start - 0.02 && t < w.end + 0.05;
          return <span key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 56, lineHeight: 1.3, padding: '0 10px', borderRadius: 12, whiteSpace: 'nowrap',
            color: active || t >= w.end ? '#fff' : '#ffffff88', background: active ? color : 'transparent', transform: `scale(${active ? 1.05 : 1})`,
            textShadow: active ? 'none' : '0 4px 18px #000, 0 2px 0 #000' }}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

const Scene: React.FC<{ p: SPart; last: boolean; tl: StudioTimeline }> = ({ p, last, tl }) => {
  const vis = [...p.visuals].sort((a, b) => a.at - b.at);
  const visEnd = last ? p.sceneEnd - ENDCARD : p.sceneEnd;
  return (
    <>
      <ZoneA color={p.color}>
        {vis.map((b, i) => (
          <Group key={i} from={i === 0 ? p.sceneStart : b.at} to={i + 1 < vis.length ? vis[i + 1].at : visEnd}>
            <RenderBlock b={b} color={p.color} partEnd={p.end} />
          </Group>
        ))}
        {last && (
          <Group from={visEnd} to={p.sceneEnd + 1}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
              <Logo brand={tl.brand} size={190} />
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 76, color: '#fff' }}>{tl.brand.name}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: tl.brand.colors.accent, direction: 'ltr' }}>{tl.brand.handle}</div>
            </div>
          </Group>
        )}
      </ZoneA>
      <ZoneB until={last ? p.sceneEnd + 1 : p.sceneEnd} items={[
        ...p.heads.map((h) => ({ at: h.at, node: h.stat ? <BStat value={h.stat} label={h.label ?? ''} color={h.color ?? p.color} />
          : <BChip text={h.chip!} color={h.color ?? p.color} textColor={h.textColor} /> })),
        ...(last ? [{ at: visEnd, node: <BChip text={tl.brand.tagline} color={tl.brand.colors.primary} /> }] : []),
      ]} />
    </>
  );
};

export const StudioVideo: React.FC<StudioProps> = ({ tl, withAudio, showSafeZones }) => {
  const { t } = useTime();
  const cur = tl.parts.find((p) => t >= p.sceneStart && t < p.sceneEnd) ?? tl.parts[tl.parts.length - 1];
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: '#050509' }}>
      <Cinematic color={cur.color} seed={2} />
      {withAudio && tl.parts.map((p) => <Sequence key={p.key} from={Math.round(p.start * FPS)}><Audio src={staticFile(p.audio)} /></Sequence>)}
      {tl.parts.map((p, i) => (
        <SceneWrap key={p.key} p={p as any}><Scene p={p} last={i === tl.parts.length - 1} tl={tl} /></SceneWrap>
      ))}
      {tl.parts.slice(1).map((p) => <LightSweep key={p.key} at={p.sceneStart} />)}
      <Kicker tl={tl} p={cur} />
      <Captions parts={tl.parts} />
      {showSafeZones && <SafeZoneOverlay />}
    </AbsoluteFill>
  );
};
