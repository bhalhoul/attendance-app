// كوفر ملفت (1080×1920) — كل ما هو مهم داخل 1080×1440 ف الوسط (قصّ شبكة Instagram)
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { FONT } from '../theme';
import { Emoji } from '../weeklypro/kit';
import { Logo, type Brand } from './StudioVideo';

export type CoverSpec = {
  style: 'versus' | 'hero' | 'photo';
  photo?: string;            // photo: صورة من public/
  labels?: { t: string; c: string }[]; // أسماء تحت الصورة
  kicker: string;            // شارة فوق (مثلاً «🔥 ترند»)
  lines: string[];           // العنوان (2–3 سطور قصار)
  highlight?: number;        // رقم السطر اللي كيتلوّن
  a?: { e: string; c: string }; b?: { e: string; c: string }; // versus: علمين + لونين
  e?: string;                // hero: إيموجي كبير
  badge?: string;            // شريط مائل (مثلاً «⚖️ قرار الطاس»)
  cta: string;               // تحت (مثلاً «الجواب في الفيديو 👀»)
};
export type CoverProps = { spec: CoverSpec; brand: Brand };

const stroke = (w: number, c = '#000') => ({ WebkitTextStroke: `${w}px ${c}`, paintOrder: 'stroke fill' } as React.CSSProperties);

export const Cover: React.FC<CoverProps> = ({ spec, brand }) => {
  const acc = brand.colors.accent, pri = brand.colors.primary;
  return (
    <AbsoluteFill style={{ background: '#07070f', overflow: 'hidden', fontFamily: FONT }}>
      {/* خلفية */}
      {spec.style === 'versus' && spec.a && spec.b ? (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, ${spec.b.c} 0%, ${spec.b.c}cc 46%, transparent 46.2%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent 53.8%, ${spec.a.c}cc 54%, ${spec.a.c} 100%)` }} />
          <div style={{ position: 'absolute', left: '50%', top: -100, bottom: -100, width: 26, background: acc, transform: 'translateX(-50%) rotate(15deg)', boxShadow: `0 0 80px ${acc}` }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 45%, ${pri}aa 0%, #3a0a0a 45%, #07070f 80%)` }} />
      )}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 40%, #000c 100%)' }} />
      {/* أشعة */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: 0.18, mixBlendMode: 'screen' }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return <polygon key={i} fill="#fff" points={`540,880 ${540 + Math.cos(a) * 1600},${880 + Math.sin(a) * 1600} ${540 + Math.cos(a + 0.12) * 1600},${880 + Math.sin(a + 0.12) * 1600}`} />;
        })}
      </svg>

      {/* المحتوى ف المنطقة 240..1680 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 260, display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 54, color: '#fff', background: pri, padding: '8px 36px', borderRadius: 18, direction: 'rtl',
          transform: 'rotate(-3deg)', boxShadow: `0 0 40px ${pri}, 0 10px 0 #0008`, border: '4px solid #fff' }}>{spec.kicker}</div>
      </div>

      {spec.style === 'photo' && spec.photo ? (
        <div style={{ position: 'absolute', left: 30, right: 30, top: 360, height: 560, borderRadius: 36, overflow: 'hidden', border: '8px solid #fff', boxShadow: '0 30px 80px #000c' }}>
          <Img src={staticFile(spec.photo)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, #000c 100%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, display: 'flex' }}>
            {(spec.labels ?? []).map((l, i) => <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: l.c, padding: '4px 18px', borderRadius: 12, fontWeight: 900, fontSize: 40, color: '#fff', direction: 'rtl' }}>{l.t}</div></div>)}
          </div>
        </div>
      ) : spec.style === 'versus' && spec.a && spec.b ? (
        <>
          {[{ x: 270, it: spec.b }, { x: 810, it: spec.a }].map(({ x, it }, i) => (
            <div key={i} style={{ position: 'absolute', left: x, top: 560, transform: 'translate(-50%,-50%)', width: 330, height: 330, borderRadius: '50%',
              background: '#ffffff22', border: '10px solid #fff', boxShadow: '0 30px 80px #000c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Emoji e={it.e} size={210} />
            </div>
          ))}
          <div style={{ position: 'absolute', left: 540, top: 560, transform: 'translate(-50%,-50%) rotate(-8deg)', width: 190, height: 190, borderRadius: '50%',
            background: acc, border: '10px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 96, color: '#111',
            direction: 'ltr', boxShadow: `0 0 70px ${acc}` }}>VS</div>
          {spec.e && <div style={{ position: 'absolute', left: 540, top: 820, transform: 'translate(-50%,-50%)', filter: 'drop-shadow(0 0 50px #ffd23f)' }}><Emoji e={spec.e} size={170} /></div>}
        </>
      ) : (
        <div style={{ position: 'absolute', left: 540, top: 640, transform: 'translate(-50%,-50%)', filter: `drop-shadow(0 0 80px ${acc})` }}>
          <Emoji e={spec.e ?? '🔥'} size={420} />
          <div style={{ position: 'absolute', right: -90, top: -60, fontWeight: 900, fontSize: 300, color: acc, ...stroke(14), transform: 'rotate(12deg)' }}>؟</div>
        </div>
      )}

      {/* العنوان */}
      <div style={{ position: 'absolute', left: 40, right: 40, top: spec.style === 'versus' ? 940 : spec.style === 'photo' ? 950 : 960, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {spec.lines.map((l, i) => {
          const hl = i === spec.highlight;
          const size = Math.min(hl ? 150 : 120, Math.round(1000 / Math.max(4, [...l].length) * 1.7));
          return (
            <div key={i} style={{ fontWeight: 900, fontSize: size, lineHeight: 1.18, direction: 'rtl', whiteSpace: 'nowrap', color: hl ? acc : '#fff',
              ...stroke(hl ? 16 : 12), textShadow: '0 14px 0 #000a', transform: hl ? 'rotate(-2deg) scale(1.03)' : undefined }}>{l}</div>
          );
        })}
      </div>

      {spec.badge && (
        <div style={{ position: 'absolute', left: -40, right: -40, top: 1395, height: 96, background: pri, transform: 'rotate(-4deg)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 10px 40px #000a', borderTop: '6px solid #fff', borderBottom: '6px solid #fff' }}>
          <div style={{ fontWeight: 900, fontSize: 56, color: '#fff', direction: 'rtl', whiteSpace: 'nowrap' }}>{spec.badge}</div>
        </div>
      )}

      <div style={{ position: 'absolute', left: 0, right: 0, top: 1545, display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 60, color: '#111', background: acc, padding: '10px 44px', borderRadius: 999, direction: 'rtl', boxShadow: `0 0 50px ${acc}aa, 0 10px 0 #0008`,
          border: '5px solid #111' }}>{spec.cta}</div>
      </div>

      {/* اللوغو */}
      <div style={{ position: 'absolute', right: 60, top: 1700, display: 'flex', alignItems: 'center', gap: 14, direction: 'rtl' }}>
        <Logo brand={brand} size={70} />
        <div style={{ fontWeight: 900, fontSize: 40, color: '#fff' }}>{brand.name}</div>
      </div>
    </AbsoluteFill>
  );
};
