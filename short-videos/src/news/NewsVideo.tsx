import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { LAYOUT, SAFE_AREA } from '../../shared/safe-zones.js';
import { ITEM_CUES, NEWS_INTRO, itemRange, newsOutro } from '../../shared/news-timing.js';
import { beat } from '../../shared/timing.js';
import { beatPulse, clamp, fit, pop } from '../anim';
import { AnimatedText } from '../components/AnimatedText';
import { Background } from '../components/Background';
import { Pill } from '../components/Pill';
import { SafeZoneOverlay } from '../components/SafeZoneOverlay';
import { COLORS, FONT } from '../theme';
import type { NewsItem, NewsProps } from './types';

const Center: React.FC<{ top: number; height?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, height, children, style }) => (
  <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top, height,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...style }}>{children}</div>
);

// شريط تقدم بحال الستوريات: جزء لكل خبر
const Progress: React.FC<{ count: number }> = ({ count }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 10, width: '100%', direction: 'rtl' }}>
      {Array.from({ length: count }).map((_, i) => {
        const r = itemRange(i);
        const p = interpolate(frame, [r.from, r.to], [0, 1], clamp);
        return (
          <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
            <div style={{ width: `${p * 100}%`, height: '100%', background: '#fff', marginRight: 0, marginLeft: 'auto' }} />
          </div>
        );
      })}
    </div>
  );
};

const Story: React.FC<{ item: NewsItem; index: number; count: number }> = ({ item, index, count }) => {
  const frame = useCurrentFrame();
  const { from, to } = itemRange(index);
  if (frame < from - 2 || frame >= to + 2) return null;
  const f = frame - from;
  const at = (b: number) => from + beat(b);
  // دخول من اليمين وخروج لليسار (اتجاه القراءة العربية)
  const enter = interpolate(f, [0, 10], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const exit = interpolate(frame, [to - 8, to], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const x = enter * 700 - exit * 700;
  const emo = pop(frame, at(ITEM_CUES.emoji), 9, 200);
  const cat = pop(frame, at(ITEM_CUES.category) + 2, 11, 200);
  const src = pop(frame, at(ITEM_CUES.source), 12, 200);
  const p = beatPulse(frame);
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)`, opacity: 1 - exit * 0.6 }}>
      {/* هالة لون التصنيف */}
      <div style={{ position: 'absolute', left: SAFE_AREA.centerX - 300, top: 380, width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${item.color}66 0%, transparent 65%)`, opacity: 0.7 + 0.3 * p }} />
      <Center top={400} height={200}>
        <div style={{ width: 190, height: 190, borderRadius: 48, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 110, transform: `scale(${emo}) rotate(${(1 - emo) * -25}deg)`, boxShadow: `0 20px 60px ${item.color}88, inset 0 0 0 4px rgba(255,255,255,0.25)` }}>
          {item.emoji}
        </div>
      </Center>
      <Center top={630} height={70}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: '#fff', direction: 'rtl', background: item.color,
          padding: '6px 30px', borderRadius: 999, transform: `scale(${cat})`, opacity: cat }}>
          {item.category} · {index + 1}/{count}
        </div>
      </Center>
      <Center top={715} height={300}>
        <AnimatedText text={item.headline} start={at(ITEM_CUES.headline)} size={Math.max(54, fit(item.headline, 74, 34))} stagger={3} />
      </Center>
      <Center top={1030} height={260} style={{ gap: 18 }}>
        {item.details.map((d, k) => {
          const st = at(k === 0 ? ITEM_CUES.detail1 : ITEM_CUES.detail2);
          const s = pop(frame, st, 12, 200);
          if (frame < st) return <div key={k} style={{ height: 0 }} />;
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 16, direction: 'rtl', width: '100%',
              transform: `translateX(${(1 - s) * 80}px)`, opacity: Math.min(1, s * 1.5) }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, background: item.color, flexShrink: 0, boxShadow: `0 0 0 5px ${item.color}44` }} />
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: Math.max(38, fit(d, 46, 34)), color: 'rgba(255,255,255,0.92)', lineHeight: 1.35 }}>{d}</div>
            </div>
          );
        })}
      </Center>
      <Center top={1300} height={60}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, color: 'rgba(255,255,255,0.7)', direction: 'rtl', opacity: src }}>
          📰 المصدر: <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>{item.source}</span>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// شريط أخبار متحرك داخل المنطقة الآمنة
const Ticker: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const unit = `${text}   •   `;
  const shift = (frame * 3) % 1200;
  return (
    <div style={{ position: 'absolute', left: SAFE_AREA.left, width: SAFE_AREA.width, top: 1395, height: 54, overflow: 'hidden',
      background: 'rgba(0,0,0,0.45)', borderRadius: 14, borderRight: `8px solid ${COLORS.accent2}` }}>
      <div style={{ position: 'absolute', right: -1200 + shift, top: 6, whiteSpace: 'nowrap', direction: 'rtl', fontFamily: FONT, fontWeight: 700,
        fontSize: 28, color: '#fff' }}>{unit.repeat(8)}</div>
    </div>
  );
};

export const NewsVideo: React.FC<NewsProps> = ({ news, showSafeZones }) => {
  const frame = useCurrentFrame();
  const count = news.items.length;
  const outro = newsOutro(count);
  const introOut = interpolate(frame, [NEWS_INTRO.to - 10, NEWS_INTRO.to], [1, 0], clamp);
  const logo = pop(frame, -4, 9, 160);
  const flash = interpolate(frame, [NEWS_INTRO.to - 2, NEWS_INTRO.to, NEWS_INTRO.to + 6], [0, 0.7, 0], clamp);
  const p = beatPulse(frame);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Background />
      <Audio src={staticFile(`audio/${news.id}.wav`)} />

      {/* رأس ثابت: العلامة + التاريخ + شريط التقدم */}
      {frame >= NEWS_INTRO.to - 4 && (
        <Center top={LAYOUT.topBlock.top} height={120} style={{ gap: 14, opacity: interpolate(frame, [NEWS_INTRO.to - 4, NEWS_INTRO.to + 4], [0, 1], clamp) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, direction: 'rtl' }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#fff', background: COLORS.accent2, padding: '4px 22px', borderRadius: 10 }}>
              🔴 {news.brand}
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: 'rgba(255,255,255,0.85)' }}>{news.dateLabel}</div>
          </div>
          {frame < outro.from + 6 && <Progress count={count} />}
        </Center>
      )}

      {/* المقدمة */}
      {frame < NEWS_INTRO.to + 2 && (
        <AbsoluteFill style={{ opacity: introOut, transform: `scale(${1 + (1 - introOut) * 0.2})` }}>
          <Center top={380} height={300}>
            <div style={{ fontSize: 150, transform: `scale(${logo * (1 + 0.05 * p)})` }}>📰</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 110, color: '#fff', transform: `scale(${logo})`,
              textShadow: `0 8px 0 ${COLORS.accent2}` }}>{news.brand}</div>
          </Center>
          <Center top={775} height={80}>
            <Pill text={news.dateLabel} start={beat(1)} end={NEWS_INTRO.to + 10} size={40} bg={COLORS.accent} color="#111" />
          </Center>
          <Center top={890} height={260}>
            <AnimatedText text={news.intro.title} start={beat(2)} size={70} highlight={['دقيقة']} highlightColor={COLORS.accent} />
          </Center>
          <Center top={1130} height={120}>
            <AnimatedText text={news.intro.sub} start={beat(4)} size={50} weight={800} highlight={['6']} highlightColor={COLORS.accent3} />
          </Center>
        </AbsoluteFill>
      )}

      {news.items.map((item, i) => <Story key={i} item={item} index={i} count={count} />)}

      {/* الخاتمة */}
      {frame >= outro.from && (
        <AbsoluteFill>
          <Center top={430} height={200}>
            <div style={{ fontSize: 140, transform: `scale(${pop(frame, outro.from, 9, 180)})` }}>💬</div>
          </Center>
          <Center top={650} height={300}>
            <AnimatedText text={news.outro.question} start={outro.from + 4} size={72} highlight={['فاجأك']} highlightColor={COLORS.accent} />
          </Center>
          <Center top={980} height={220}>
            <AnimatedText text={news.outro.share} start={outro.from + beat(3)} size={52} weight={800} highlight={['صيفط']} highlightColor={COLORS.accent3} />
          </Center>
        </AbsoluteFill>
      )}

      {frame >= NEWS_INTRO.to && <Ticker text={`${news.brand} • ${news.dateLabel} • ${news.items.map((it) => it.emoji + ' ' + it.category).join(' • ')}`} />}
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}
      {showSafeZones && <SafeZoneOverlay />}
    </AbsoluteFill>
  );
};
