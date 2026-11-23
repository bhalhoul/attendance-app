// كوفر صفحة Facebook (1640×624). ف التيليفون: كيبان غير الوسط (x 265..1375) وصورة البروفايل كتغطي الوسط-التحت.
// → الوسط ضو وأشعة (من ورا اللوغو)، الكتابة فوق وعلى الجناب.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FONT } from '../theme';
import { Emoji } from '../weeklypro/kit';
import type { Brand } from './StudioVideo';

const Pill: React.FC<{ e: string; t: string; c: string }> = ({ e, t, c }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, direction: 'rtl', background: `linear-gradient(135deg, ${c}, ${c}aa)`, padding: '8px 16px',
    borderRadius: 18, boxShadow: `0 10px 30px ${c}55, inset 0 0 0 2px #ffffff30`, whiteSpace: 'nowrap' }}>
    <Emoji e={e} size={28} />
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 29, color: '#fff' }}>{t}</div>
  </div>
);

export const FbCover: React.FC<{ brand: Brand }> = ({ brand }) => {
  const pri = brand.colors.primary, acc = brand.colors.accent;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 70%, #5a1218 0%, #1a0a1e 45%, #07070f 85%)', overflow: 'hidden', fontFamily: FONT }}>
      <svg width={1640} height={624} style={{ position: 'absolute', inset: 0, opacity: 0.16 }}>
        {Array.from({ length: 28 }).map((_, i) => {
          const a = (i / 28) * Math.PI * 2;
          return <polygon key={i} fill="#fff" points={`820,470 ${820 + Math.cos(a) * 1400},${470 + Math.sin(a) * 1400} ${820 + Math.cos(a + 0.08) * 1400},${470 + Math.sin(a + 0.08) * 1400}`} />;
        })}
      </svg>
      <div style={{ position: 'absolute', left: 820 - 330, top: 470 - 330, width: 660, height: 660, borderRadius: '50%', background: `radial-gradient(circle, ${pri}99 0%, transparent 65%)` }} />
      {/* شبكة خفيفة */}
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(#ffffff0a 1px, transparent 1px), linear-gradient(90deg, #ffffff0a 1px, transparent 1px)', backgroundSize: '48px 48px',
        maskImage: 'linear-gradient(180deg, #000 0%, transparent 80%)' }} />

      {/* العنوان فوق (كيبان ف التيليفون والحاسوب) */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ fontWeight: 900, fontSize: 92, color: '#fff', direction: 'rtl', lineHeight: 1.1, textShadow: '0 8px 0 #000a, 0 0 40px #000',
          WebkitTextStroke: '6px #000', paintOrder: 'stroke fill' } as React.CSSProperties}>
          أهم الأخبار… <span style={{ color: acc }}>بالمختصر</span>
        </div>
        <div style={{ fontWeight: 800, fontSize: 34, color: '#ffffffcc', direction: 'rtl' }}>من المغرب إلى العالم 🌍 كل يوم في أقل من دقيقة</div>
      </div>

      {/* الجناب: الأشكال */}
      <div style={{ position: 'absolute', right: 300, top: 255, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end' }}>
        <Pill e="⚡" t="خبر سريع" c="#E08E00" />
        <Pill e="🔴" t="الخبر الأهم" c={pri} />
        <Pill e="⚽" t="نتائج المباريات" c="#2E7D32" />
      </div>
      <div style={{ position: 'absolute', left: 300, top: 255, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
        <Pill e="⏱️" t="اليوم في دقيقة" c="#1E88E5" />
        <Pill e="🗓️" t="ملخص الأسبوع" c="#8E24AA" />
        <Pill e="🔥" t="ترند" c="#FF3D00" />
      </div>

      {/* الحساب (يمين تحت، ف الحاسوب) */}
      <div style={{ position: 'absolute', right: 36, bottom: 24, fontWeight: 800, fontSize: 30, color: '#ffffffb0', direction: 'ltr' }}>{brand.handle}</div>
    </AbsoluteFill>
  );
};
