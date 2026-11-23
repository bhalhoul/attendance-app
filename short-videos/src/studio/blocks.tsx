// مكتبة الرسوم القابلة لإعادة الاستعمال (المنطقة A، إحداثيات محلية 820×500)
// كل نوع كيتختار من ملف الحلقة: { "type": "hero", "at": "كلمة", ... }
import React from 'react';
import { Easing } from 'remotion';
import { FONT } from '../theme';
import { Badge, Counter, Emoji, useTime } from '../weeklypro/kit';

const W = 820, H = 500, CX = W / 2;
export type Block = { type: string; at: number; [k: string]: any };
const interpolateFlash = (t: number, at: number) => (t < at || t > at + 0.35 ? 0 : 0.8 * (1 - (t - at) / 0.35));

const At: React.FC<{ x: number; y: number; at?: number; children: React.ReactNode }> = ({ x, y, at, children }) => {
  const { t, sp } = useTime();
  if (at !== undefined && t < at - 0.02) return null;
  const s = at === undefined ? 1 : sp(at, 11, 190);
  return <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.3 + 0.7 * s})`, opacity: Math.min(1, s * 1.6) }}>{children}</div>;
};
const T: React.FC<{ size: number; color?: string; weight?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, color = '#fff', weight = 800, children, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, color, direction: 'rtl', whiteSpace: 'nowrap', lineHeight: 1.2, textAlign: 'center', textShadow: '0 4px 18px #000a', ...style }}>{children}</div>
);
const fit = (s: string, base: number, max: number) => Math.round(base * Math.min(1, max / Math.max(1, [...s].length)));

export const RenderBlock: React.FC<{ b: Block; color: string; partEnd: number }> = ({ b, color, partEnd }) => {
  const { t, sp, lin } = useTime();
  switch (b.type) {
    case 'title':
      return <>{b.lines.map((l: any, i: number) => (
        <At key={i} at={b.at + i * 0.25} x={CX} y={H / 2 + (i - (b.lines.length - 1) / 2) * 150}>
          <T size={fit(l.text, l.size ?? 120, 7)} weight={900} style={l.gradient ? { background: 'linear-gradient(90deg,#ffd23f,#ff4f8b)', WebkitBackgroundClip: 'text', color: 'transparent', textShadow: 'none' } : undefined}>{l.text}</T>
        </At>))}</>;
    case 'hero': {
      const lbl = b.label as string | undefined;
      return (<>
        <At at={b.at} x={CX} y={lbl ? 205 : H / 2}>
          <div style={{ position: 'relative', display: 'flex', gap: 30, transform: `translateY(${Math.sin(t * 2) * 6}px)` }}>
            <div style={{ position: 'absolute', inset: -60, borderRadius: '50%', background: `radial-gradient(circle, ${color}55, transparent 65%)` }} />
            <Emoji e={b.e} size={b.e2 ? 170 : 220} />{b.e2 && <Emoji e={b.e2} size={170} />}
            {b.badge && <div style={{ position: 'absolute', right: -40, bottom: -20, transform: `scale(${sp(b.at + 0.5, 8, 200)})` }}><Emoji e={b.badge} size={110} /></div>}
          </div>
        </At>
        {lbl && <At at={b.at + 0.25} x={CX} y={430}><T size={fit(lbl, 52, 16)}>{lbl}</T></At>}
      </>);
    }
    case 'flags': {
      const n = b.items.length, gap = W / n;
      return <>{b.items.map((it: any, i: number) => (
        <At key={i} at={it.at ?? b.at + i * 0.2} x={W - gap * (i + 0.5)} y={H / 2}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Badge e={it.e} size={n > 2 ? 170 : 200} color={color} />
            <T size={fit(it.l, 34, 12)}>{it.l}</T>
          </div>
        </At>))}</>;
    }
    case 'versus': {
      const vs = sp(b.at + 0.5, 8, 220);
      const side = (it: any, x: number, d: number) => (
        <At at={b.at + d} x={x} y={H / 2}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Badge e={it.e} size={210} color={color} ring={Math.abs(Math.sin(t * 3 + d * 5)) * 0.6} />
            <T size={40}>{it.l}</T>
          </div>
        </At>);
      return (<>
        {side(b.a, 640, 0)}{side(b.b, 180, 0.2)}
        <div style={{ position: 'absolute', left: CX, top: H / 2 - 20, transform: `translate(-50%,-50%) scale(${vs}) rotate(${(1 - vs) * -30}deg)`, width: 130, height: 130, borderRadius: '50%',
          background: '#ffd23f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#111', direction: 'ltr', boxShadow: '0 0 0 8px #111, 0 0 50px #ffd23f88' }}>VS</div>
      </>);
    }
    case 'counter':
      return (<>
        <At at={b.at} x={CX} y={b.label ? 210 : H / 2}>
          <Counter at={b.at} to={b.to} dur={1.3} size={180} color="#fff" glow={color}
            fmt={(n) => `${b.prefix ?? ''}${b.group ? Math.round(n).toLocaleString('en-US') : (b.decimals ? n.toFixed(b.decimals) : Math.round(n))}${b.suffix ?? ''}`} />
        </At>
        {b.label && <At at={b.at + 0.3} x={CX} y={400}><T size={fit(b.label, 50, 18)} color="#ffffffd0">{b.label}</T></At>}
      </>);
    case 'doc': {
      const strike = b.strikeAt ? lin(b.strikeAt, b.strikeAt + 0.5) : 0;
      const stamp = b.stamp ? sp(b.at + 0.6, 8, 200) : 0;
      return (
        <At at={b.at} x={CX} y={H / 2}>
          <div style={{ position: 'relative', width: 560, padding: 30, borderRadius: 24, background: '#f5f5f5', boxShadow: '0 20px 60px #0009', direction: 'rtl' }}>
            <div style={{ position: 'relative', display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: 52, color: strike > 0.5 ? '#9e9e9e' : '#212121', marginBottom: 18 }}>
              {b.title}
              <div style={{ position: 'absolute', left: -6, right: -6, top: '52%', height: 8, background: '#d32f2f', transform: `scaleX(${strike})`, transformOrigin: 'right' }} />
            </div>
            {[1, 0.85, 0.95, 0.7].map((w, i) => <div key={i} style={{ height: 16, width: `${w * 100}%`, marginBottom: 14, borderRadius: 8, background: '#cfcfcf' }} />)}
            {b.stamp && <div style={{ position: 'absolute', left: 20, bottom: 24, transform: `rotate(-12deg) scale(${stamp})`, border: '6px solid #2e7d32', color: '#2e7d32', borderRadius: 14,
              padding: '2px 22px', fontFamily: FONT, fontWeight: 900, fontSize: 48 }}>{b.stamp}</div>}
            {strike > 0 && <div style={{ position: 'absolute', left: 20, bottom: 24, transform: `rotate(-12deg) scale(${sp(b.strikeAt + 0.3, 8, 200)})`, border: '6px solid #d32f2f', color: '#d32f2f',
              borderRadius: 14, padding: '2px 22px', fontFamily: FONT, fontWeight: 900, fontSize: 48 }}>مرفوض</div>}
          </div>
        </At>);
    }
    case 'score': {
      // بطاقة نتيجة: المستضيف على اليمين (RTL) — ألوان الفريق بلا شعارات (حقوق)
      const showAt = b.scoreAt ?? b.at + 0.5;
      const sc = sp(showAt, 9, 200);
      const team = (tm: any, x: number, d: number, win: boolean) => (
        <At at={b.at + d} x={x} y={225}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 160, height: 160, borderRadius: '50%', background: `linear-gradient(135deg, ${tm.c} 0 50%, ${tm.c2 ?? tm.c} 50% 100%)`,
              boxShadow: `0 0 0 6px ${win && t >= showAt ? '#ffd23f' : '#ffffff33'}, 0 20px 50px #0009`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff', textShadow: '0 3px 10px #000a', direction: 'ltr' }}>{tm.abbr}</div>
            </div>
            <T size={fit(tm.name, 40, 10)}>{tm.name}</T>
          </div>
        </At>);
      return (<>
        {b.comp && <At at={b.at} x={CX} y={50}><T size={30} color="#ffffffb0">{b.comp}</T></At>}
        {team(b.home, 665, 0, b.hs > b.as)}{team(b.away, 155, 0.15, b.as > b.hs)}
        {t >= showAt - 0.02 && (
          <div style={{ position: 'absolute', left: CX, top: 200, transform: `translate(-50%,-50%) scale(${0.4 + 0.6 * sc})`, opacity: Math.min(1, sc * 1.5),
            fontFamily: FONT, fontWeight: 900, fontSize: 100, color: '#fff', direction: 'ltr', whiteSpace: 'nowrap', textShadow: `0 0 40px ${color}, 0 8px 0 #0007` }}>
            {b.as}<span style={{ color: '#ffffff66', margin: '0 10px' }}>-</span>{b.hs}
          </div>
        )}
        {b.note && <At at={showAt + 0.3} x={CX} y={300}><T size={28} color="#ffd23f">{b.note}</T></At>}
      </>);
    }
    case 'hook': {
      // الهوك: ظاهر من أول فريم، زوم + اهتزاز + فلاش — كيشد المشاهد ف أول ثانية
      const k = sp(b.at - 0.75, 9, 230); // ف الفريم 0 النص ديجا ظاهر
      const shake = t < b.at + 0.6 ? Math.sin(t * 60) * 8 * Math.max(0, 1 - (t - b.at + 0.35) / 0.95) : 0;
      return (<>
        {b.e && <div style={{ position: 'absolute', left: CX, top: H / 2, transform: `translate(-50%,-50%) scale(${1.1 + 0.05 * Math.sin(t * 5)})`, opacity: 0.35, filter: 'blur(2px)' }}>
          <Emoji e={b.e} size={420} /></div>}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22,
          transform: `translateX(${shake}px) scale(${1.25 - 0.25 * k})` }}>
          {b.lines.map((l: any, i: number) => (
            <div key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: fit(l.text, l.size ?? 96, 11), lineHeight: 1.3, direction: 'rtl', whiteSpace: 'nowrap',
              color: l.color ?? '#fff', textShadow: '0 6px 0 #000a, 0 0 40px #000', opacity: Math.min(1, k * 2) }}>
              {l.mark ? <span style={{ display: 'inline-block', lineHeight: 1.25, background: color, padding: '0 20px 6px', borderRadius: 16, boxShadow: `0 0 40px ${color}aa` }}>{l.text}</span> : l.text}
            </div>
          ))}
        </div>
      </>);
    }
    case 'reveal': {
      // الكشف: علامة استفهام ضبابية كتتحول للجواب مع فلاش
      const r = b.revealAt ?? b.at + 1;
      const before = t < r;
      const s2 = sp(r, 9, 190);
      const flash = interpolateFlash(t, r);
      return (<>
        {before ? (
          <At at={b.at} x={CX} y={H / 2}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 300, color: '#ffd23f', filter: `blur(${4 + 3 * Math.abs(Math.sin(t * 4))}px)`, transform: `scale(${1 + 0.06 * Math.sin(t * 8)})` }}>؟</div>
          </At>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
            transform: `scale(${0.6 + 0.4 * s2})`, opacity: Math.min(1, s2 * 1.6) }}>
            {b.e && <Emoji e={b.e} size={150} />}
            <T size={fit(b.label, 64, 16)} weight={900} color="#fff">{b.label}</T>
            {b.sub && <T size={fit(b.sub, 40, 26)} color="#ffd23f">{b.sub}</T>}
          </div>
        )}
        {flash > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />}
      </>);
    }
    case 'question':
      return <At at={b.at} x={CX} y={H / 2}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 330, lineHeight: 1, color: '#ffd23f', transform: `scale(${1 + 0.04 * Math.sin(t * 6)})`, textShadow: '0 0 70px #ffd23f88' }}>؟</div></At>;
    case 'recap':
      return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, direction: 'rtl' }}>
        {b.items.map((it: any, i: number) => { const s = sp(b.at + i * 0.3, 10, 180);
          return <div key={i} style={{ width: 140, height: 140, borderRadius: 34, background: `linear-gradient(145deg, ${it.c}, ${it.c}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${s}) translateY(${Math.sin(t * 3 + i) * 6}px)`, opacity: Math.min(1, s * 1.5) }}><Emoji e={it.e} size={78} /></div>; })}
      </div>;
    case 'clock': {
      const sweep = lin(b.at, partEnd, 0, 1, Easing.linear);
      return <At at={b.at} x={CX} y={H / 2}>
        <div style={{ position: 'relative', width: 400, height: 400 }}>
          <svg width={400} height={400} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx={200} cy={200} r={175} stroke="#ffffff22" strokeWidth={20} fill="#0005" />
            <circle cx={200} cy={200} r={175} stroke={color} strokeWidth={20} fill="none" strokeLinecap="round" strokeDasharray={1100} strokeDashoffset={1100 * (1 - sweep)} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 140, color: '#fff', direction: 'ltr', lineHeight: 1 }}>{b.text}</div>
            <T size={40} color="#ffd23f">{b.label}</T>
          </div>
        </div>
      </At>;
    }
    case 'flash': {
      const k = sp(b.at, 9, 200);
      const sh = t < b.at + 0.5 ? Math.sin(t * 70) * 10 * (1 - (t - b.at) / 0.5) : 0;
      return (<>
        <div style={{ position: 'absolute', left: -100, right: -100, top: H / 2 - 95, height: 190, background: `repeating-linear-gradient(135deg, ${color}, ${color} 40px, #111 40px, #111 80px)`,
          transform: `translateX(${(1 - k) * 900}px) rotate(-6deg)`, opacity: 0.9 }} />
        <div style={{ position: 'absolute', left: CX, top: H / 2, transform: `translate(calc(-50% + ${sh}px),-50%) scale(${0.5 + 0.5 * k})`, background: '#111', border: `6px solid ${color}`, borderRadius: 24,
          padding: '10px 44px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <Emoji e="⚡" size={90} /><T size={110} weight={900} color={color}>{b.text}</T>
        </div>
      </>);
    }
    case 'text':
      return <div style={{ position: 'absolute', inset: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: b.size ?? 60, color: '#fff', direction: 'rtl', textAlign: 'center', lineHeight: 1.4 }}>{b.text}</div></div>;
    case 'tiles': {
      const n = b.items.length, two = n === 4;
      return <>{b.items.map((it: any, i: number) => {
        const x = two ? (i % 2 === 0 ? 615 : 205) : W - (W / n) * (i + 0.5), y = two ? (i < 2 ? 130 : 370) : H / 2;
        return <At key={i} at={it.at ?? b.at + i * 0.2} x={x} y={y}>
          <div style={{ width: two ? 370 : Math.min(240, W / n - 30), height: two ? 210 : 300, borderRadius: 30, background: `linear-gradient(145deg, ${it.c ?? color}, ${it.c ?? color}55)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: 'inset 0 0 0 2px #ffffff30' }}>
            <Emoji e={it.e} size={two ? 84 : 100} /><T size={fit(it.l, 34, 11)}>{it.l}</T></div></At>; })}</>;
    }
    case 'bars': {
      const max = b.max ?? Math.max(...b.items.map((x: any) => x.v));
      const hgt = Math.min(110, 400 / b.items.length);
      return <>{b.items.map((it: any, i: number) => { const w = lin((it.at ?? b.at) + i * 0.25, (it.at ?? b.at) + 1 + i * 0.25);
        return <div key={i} style={{ position: 'absolute', left: 50, top: 50 + i * (hgt + 20), width: 720, height: hgt, direction: 'rtl' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, height: hgt, width: 560 * (it.v / max) * w, borderRadius: 16, background: it.c ?? color }} />
          <T size={Math.min(40, hgt * 0.45)} style={{ position: 'absolute', right: 20, top: hgt / 2 - 24 }}>{it.l}</T>
          <div style={{ position: 'absolute', left: 0, top: hgt / 2 - 34, fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', direction: 'ltr' }}>{(it.v * w).toFixed(it.d ?? 0)}{it.u ?? ''}</div>
        </div>; })}</>;
    }
    case 'chart': {
      const draw = lin(b.at, b.at + 2);
      const down = b.dir !== 'up';
      const pts = Array.from({ length: 22 }, (_, i) => [40 + i * 35, (down ? 90 + i * 14 : 410 - i * 14) + Math.sin(i * 1.7) * 30]);
      const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
      const c = down ? '#ff5252' : '#66bb6a';
      return <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={30} x2={790} y1={60 + i * 95} y2={60 + i * 95} stroke="#ffffff14" strokeWidth={2} />)}
        <path d={d} stroke={c} strokeWidth={9} fill="none" strokeLinejoin="round" strokeDasharray={1300} strokeDashoffset={1300 * (1 - draw)} style={{ filter: `drop-shadow(0 0 12px ${c}88)` }} />
      </svg>;
    }
    default:
      return <T size={40} color="#ff5252">نوع غير معروف: {b.type}</T>;
  }
};
