// أدوات مشتركة للمونتاج الاحترافي (زمن بالثواني، spring، عناصر بصرية)
import React from 'react';
import { interpolate, spring, useCurrentFrame, Easing } from 'remotion';
import { FONT } from '../theme';

export const FPS = 30;
export const clampX = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const useTime = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const sp = (t0: number | undefined, damping = 12, stiffness = 170) =>
    t0 === undefined ? 0 : spring({ frame: frame - Math.round(t0 * FPS), fps: FPS, config: { damping, stiffness, mass: 0.7 } });
  const lin = (t0: number, t1: number, a = 0, b = 1, ease = Easing.inOut(Easing.cubic)) =>
    interpolate(t, [t0, t1], [a, b], { ...clampX, easing: ease });
  return { frame, t, sp, lin };
};

// عنصر كيبان بحركة spring (scale + صعود)
export const Pop: React.FC<{ at?: number; x: number; y: number; w?: number; children: React.ReactNode; from?: 'up' | 'down' | 'left' | 'right' | 'zoom'; out?: number; style?: React.CSSProperties; rot?: number }> = ({
  at, x, y, w, children, from = 'zoom', out, style, rot = 0,
}) => {
  const { sp, lin, t } = useTime();
  if (at === undefined || t < at - 0.05) return null;
  const s = sp(at, 11, 180);
  const o = out !== undefined ? lin(out, out + 0.35, 1, 0) : 1;
  if (o <= 0) return null;
  const d = 1 - s;
  const tr = from === 'zoom' ? `scale(${0.3 + 0.7 * s})` : from === 'up' ? `translateY(${d * 120}px)` : from === 'down' ? `translateY(${-d * 120}px)`
    : from === 'left' ? `translateX(${-d * 300}px)` : `translateX(${d * 300}px)`;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, transform: `translate(-50%, -50%) ${tr} rotate(${rot * d}deg)`,
      opacity: Math.min(1, s * 1.6) * o, ...style }}>{children}</div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; color: string; size?: number; dim?: boolean }> = ({ children, color, size = 44, dim }) => (
  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, color: '#fff', direction: 'rtl', whiteSpace: 'nowrap',
    background: `linear-gradient(135deg, ${color}ee, ${color}99)`, padding: `${size * 0.22}px ${size * 0.6}px`, borderRadius: size * 0.6,
    boxShadow: `0 12px 40px ${color}66, inset 0 0 0 2px rgba(255,255,255,0.18)`, filter: dim ? 'grayscale(0.8) brightness(0.6)' : undefined,
    transition: 'none' }}>{children}</div>
);

export const Emoji: React.FC<{ e: string; size: number; style?: React.CSSProperties }> = ({ e, size, style }) => (
  <span style={{ fontFamily: "'Noto Color Emoji'", fontSize: size, lineHeight: 1, display: 'inline-block', ...style }}>{e}</span>
);

// دائرة فيها علم/إيموجي مع حلقة ضوء
export const Badge: React.FC<{ e: string; size: number; color: string; ring?: number }> = ({ e, size, color, ring = 0 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #ffffff22, ${color}55 60%, #0008)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 ${6 + ring * 10}px ${color}${ring ? '88' : '55'}, 0 25px 60px #0009` }}>
    <Emoji e={e} size={size * 0.58} />
  </div>
);

// رقم كبير كيعدّ
export const Counter: React.FC<{ at: number; to: number; dur?: number; fmt: (n: number) => string; size: number; color?: string; glow?: string }> = ({ at, to, dur = 1.2, fmt, size, color = '#fff', glow = '#000' }) => {
  const { lin } = useTime();
  const v = lin(at, at + dur, 0, to, Easing.out(Easing.cubic));
  return <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color, direction: 'ltr', lineHeight: 1, textShadow: `0 10px 40px ${glow}, 0 6px 0 #0006` }}>{fmt(v)}</div>;
};

export const Label: React.FC<{ children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties }> = ({ children, size = 40, color = '#fff', weight = 800, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, color, direction: 'rtl', textAlign: 'center', lineHeight: 1.3,
    textShadow: '0 4px 20px #000c', whiteSpace: 'nowrap', ...style }}>{children}</div>
);
