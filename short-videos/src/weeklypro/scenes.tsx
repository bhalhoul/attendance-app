// المشاهد — كل مشهد = مجموعات ف المنطقة A (الصورة) + عناصر متتالية ف المنطقة B (العنوان)
// الإحداثيات داخل A محلية: 820 × 500. كل حركة مربوطة بكلمة ف صوت المذيع (cues).
import React from 'react';
import { Easing } from 'remotion';
import { FONT } from '../theme';
import { Badge, Counter, Emoji, useTime } from './kit';
import { BChip, BStat, Group, ZoneA, ZoneB } from './layout';

export type Part = { key: string; start: number; end: number; sceneStart: number; sceneEnd: number; cues: Record<string, number> };
const W = 820, H = 500, CX = W / 2;

const At: React.FC<{ x: number; y: number; children: React.ReactNode; at?: number; style?: React.CSSProperties }> = ({ x, y, children, at, style }) => {
  const { t, sp } = useTime();
  if (at !== undefined && t < at - 0.02) return null;
  const s = at === undefined ? 1 : sp(at, 11, 190);
  return <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.3 + 0.7 * s})`, opacity: Math.min(1, s * 1.6), ...style }}>{children}</div>;
};
const T: React.FC<{ size: number; color?: string; weight?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, color = '#fff', weight = 800, children, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, color, direction: 'rtl', whiteSpace: 'nowrap', lineHeight: 1.2, textAlign: 'center', textShadow: '0 4px 18px #000a', ...style }}>{children}</div>
);
const Question: React.FC = () => {
  const { t } = useTime();
  return <At x={CX} y={H / 2}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 330, lineHeight: 1, color: '#ffd23f',
    transform: `scale(${1 + 0.04 * Math.sin(t * 6)})`, textShadow: '0 0 70px #ffd23f88' }}>؟</div></At>;
};

// ============ المقدمة ============
export const IntroScene: React.FC<{ p: Part; range: string; color: string }> = ({ p, range, color }) => {
  const { lin } = useTime();
  const c = p.cues;
  const tiles = [
    { at: c.summit, e: '🤝', l: 'قمة تاريخية', col: '#1e88e5' },
    { at: c.iran, e: '🔥', l: 'الشرق الأوسط', col: '#e53935' },
    { at: c.market, e: '📉', l: 'الأسواق المالية', col: '#8e24aa' },
    { at: c.ceuta, e: '🇪🇸', l: 'سبتة وإسبانيا', col: '#ef6c00' },
  ];
  const sweep = lin(c.clock, p.sceneEnd, 0, 1, Easing.linear);
  return (
    <>
      <ZoneA color={color}>
        <Group from={p.sceneStart} to={c.summit - 0.05}>
          <At x={CX} y={190}><T size={120} weight={900}>أهم أخبار</T></At>
          <At x={CX} y={340}><T size={140} weight={900} style={{ background: 'linear-gradient(90deg,#ffd23f,#ff4f8b)', WebkitBackgroundClip: 'text', color: 'transparent', textShadow: 'none' }}>الأسبوع</T></At>
        </Group>
        <Group from={c.summit - 0.05} to={c.clock - 0.05}>
          {tiles.map((tl, i) => (
            <At key={i} at={tl.at} x={i % 2 === 0 ? 615 : 205} y={i < 2 ? 130 : 370}>
              <div style={{ width: 370, height: 210, borderRadius: 30, background: `linear-gradient(145deg, ${tl.col}, ${tl.col}55)`, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 18px 40px ${tl.col}44, inset 0 0 0 2px #ffffff30` }}>
                <Emoji e={tl.e} size={84} /><T size={38}>{tl.l}</T>
              </div>
            </At>
          ))}
        </Group>
        <Group from={c.clock - 0.05} to={p.sceneEnd}>
          <At x={CX} y={H / 2}>
            <div style={{ position: 'relative', width: 400, height: 400 }}>
              <svg width={400} height={400} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                <circle cx={200} cy={200} r={175} stroke="#ffffff22" strokeWidth={20} fill="#0005" />
                <circle cx={200} cy={200} r={175} stroke="#ffd23f" strokeWidth={20} fill="none" strokeLinecap="round" strokeDasharray={1100} strokeDashoffset={1100 * (1 - sweep)} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 140, color: '#fff', direction: 'ltr', lineHeight: 1 }}>3:00</div>
                <T size={40} color="#ffd23f">دقائق فقط</T>
              </div>
            </div>
          </At>
        </Group>
      </ZoneA>
      <ZoneB until={p.sceneEnd} items={[
        { at: p.sceneStart + 0.6, node: <BChip text="ملخص الأسبوع في ثلاث دقائق" color="#ff4f8b" /> },
        { at: c.dates, node: <BChip text={`🗓️ ${range}`} color="#ffb300" textColor="#111" /> },
      ]} />
    </>
  );
};

// ============ القمة ============
export const SummitScene: React.FC<{ p: Part; color: string }> = ({ p, color }) => {
  const { t, lin } = useTime();
  const c = p.cues;
  const pts: Record<string, [number, number]> = { xi: [CX, 110], trump: [200, 315], putin: [620, 315] };
  const draw = lin(c.putin + 0.3, c.putin + 1.3);
  const leaders = [{ k: 'trump', e: '🇺🇸', n: 'ترامب' }, { k: 'xi', e: '🇨🇳', n: 'شي جين بينغ' }, { k: 'putin', e: '🇷🇺', n: 'بوتين' }];
  const weak = t >= c.weak;
  const topics = [{ at: c.nuclear, e: '☢️', l: 'الأسلحة النووية', x: 685 }, { at: c.iran, e: '🔥', l: 'الحرب مع إيران', x: CX }, { at: c.oil, e: '🛢️', l: 'النفط', x: 135 }];
  return (
    <>
      <ZoneA color={color}>
        <Group from={p.sceneStart} to={c.table}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {[['xi', 'trump'], ['trump', 'putin'], ['putin', 'xi']].map(([a, b], i) => {
              const [x1, y1] = pts[a], [x2, y2] = pts[b]; const L = Math.hypot(x2 - x1, y2 - y1);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd23f" strokeWidth={6} strokeDasharray={L} strokeDashoffset={L * (1 - draw)} opacity={0.85} />;
            })}
          </svg>
          {leaders.map((l) => (
            <At key={l.k} at={c[l.k]} x={pts[l.k][0]} y={pts[l.k][1]}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Badge e={l.e} size={140} color="#ffd23f" ring={t >= c[l.k] && t < c[l.k] + 1.4 ? 1 : 0} />
                <T size={30}>{l.n}</T>
              </div>
            </At>
          ))}
        </Group>
        <Group from={c.table} to={c.question}>
          {topics.map((tp, i) => (
            <At key={i} at={tp.at} x={tp.x} y={H / 2}>
              <div style={{ width: 240, height: 300, borderRadius: 30, background: weak ? '#ffffff10' : '#ffffff1a', border: `3px solid ${weak ? '#ff525288' : '#ffffff30'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, filter: weak ? 'grayscale(0.7)' : undefined }}>
                <Emoji e={tp.e} size={110} /><T size={32}>{tp.l}</T>
              </div>
            </At>
          ))}
        </Group>
        <Group from={c.question} to={p.sceneEnd}><Question /></Group>
      </ZoneA>
      <ZoneB until={p.sceneEnd} items={[
        { at: p.sceneStart + 0.4, node: <BChip text="قمة ثلاثية غير مسبوقة" color={color} /> },
        { at: c.city, node: <BChip text="📍 شنتشن · 19 نونبر" color="#e53935" /> },
        { at: c.first, node: <BChip text="⭐ أول لقاء ثلاثي من نوعه" color="#ffb300" textColor="#111" /> },
        { at: c.table, node: <BChip text="على طاولة النقاش" color={color} /> },
        { at: c.un, node: <BChip text="🇺🇳 إصلاح الأمم المتحدة ورفع إنتاج النفط" color="#1565c0" /> },
        { at: c.weak, node: <BChip text="❌ توافق محدود" color="#c62828" /> },
        { at: c.question, node: <BChip text="نتائج ملموسة أم صورة تاريخية؟" color="#ffb300" textColor="#111" /> },
      ]} />
    </>
  );
};

// ============ الشرق الأوسط ============
export const MideastScene: React.FC<{ p: Part; color: string }> = ({ p, color }) => {
  const { t, sp, lin } = useTime();
  const c = p.cues;
  const reduce = lin(c.stat, c.stat + 1);
  const ships = Array.from({ length: 9 });
  return (
    <>
      <ZoneA color={color}>
        <Group from={p.sceneStart} to={c.washington}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <linearGradient id="sea2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d3b66" /><stop offset="1" stopColor="#082440" /></linearGradient>
              <linearGradient id="land2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c9a66b" /><stop offset="1" stopColor="#8d6e45" /></linearGradient>
            </defs>
            <rect width={W} height={H} fill="url(#sea2)" />
            <path d={`M0 0 H${W} V150 C720 185 640 160 560 190 C470 222 380 205 290 175 C200 145 100 170 0 140 Z`} fill="url(#land2)" />
            <path d={`M0 ${H} V390 C120 372 230 410 340 395 C420 384 470 330 530 318 C575 309 610 340 620 380 C640 450 740 450 ${W} 435 V${H} Z`} fill="url(#land2)" />
          </svg>
          <T size={36} style={{ position: 'absolute', left: CX, top: 50, transform: 'translateX(-50%)' }}>🇮🇷 إيران</T>
          <T size={30} style={{ position: 'absolute', left: 170, top: 445, transform: 'translateX(-50%)' }}>شبه الجزيرة العربية</T>
          <T size={30} style={{ position: 'absolute', left: 730, top: 455, transform: 'translateX(-50%)' }}>🇴🇲 عُمان</T>
          <T size={26} color="#ffd23f" style={{ position: 'absolute', left: 430, top: 218, transform: 'translateX(-50%)' }}>مضيق هرمز</T>
          {ships.map((_, i) => {
            const keep = i % 3 === 0;
            const ph = (t * 0.07 + i / ships.length) % 1;
            const x = 30 + ph * 760, y = 300 + Math.sin(ph * Math.PI * 2 + i) * 18;
            return <div key={i} style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', opacity: keep ? 1 : 1 - reduce }}><Emoji e="🚢" size={44} /></div>;
          })}
          {t >= c.tanker - 0.02 && (
            <div style={{ position: 'absolute', left: 610, top: 330, transform: `translate(-50%,-50%) scale(${sp(c.tanker, 9, 170)})` }}>
              <Emoji e="🚢" size={70} />
              <div style={{ position: 'absolute', left: 14, top: -50, transform: `scale(${1 + 0.15 * Math.sin(t * 20)})` }}><Emoji e="🔥" size={60} /></div>
              {[0, 1, 2].map((k) => { const ph = (t * 0.7 + k / 3) % 1;
                return <div key={k} style={{ position: 'absolute', left: 40 + ph * 20, top: -60 - ph * 100, width: 40 + ph * 40, height: 40 + ph * 40, borderRadius: '50%', background: '#666', opacity: 0.45 * (1 - ph), filter: 'blur(5px)' }} />; })}
            </div>
          )}
        </Group>
        <Group from={c.washington} to={c.question}>
          <At x={CX} y={95}><Emoji e="🏛️" size={130} /></At>
          {[{ n: 51, l: 'ضد القرار', col: '#e53935', y: 255 }, { n: 48, l: 'مع القرار', col: '#43a047', y: 375 }].map((b, i) => {
            const w = lin(c.vote + i * 0.3, c.vote + 1 + i * 0.3, 0, 1);
            return (
              <div key={i} style={{ position: 'absolute', left: 60, top: b.y - 42, width: 700, height: 84, direction: 'rtl', opacity: t >= c.vote - 0.05 ? 1 : 0 }}>
                <div style={{ position: 'absolute', right: 0, top: 0, height: 84, width: 560 * (b.n / 51) * w, borderRadius: 16, background: b.col }} />
                <T size={40} style={{ position: 'absolute', right: 20, top: 14 }}>{b.l}</T>
                <div style={{ position: 'absolute', left: 0, top: 6, fontFamily: FONT, fontWeight: 900, fontSize: 60, color: '#fff', direction: 'ltr' }}>{Math.round(b.n * w)}</div>
              </div>
            );
          })}
        </Group>
        <Group from={c.question} to={p.sceneEnd}><Question /></Group>
      </ZoneA>
      <ZoneB until={p.sceneEnd} items={[
        { at: p.sceneStart + 0.4, node: <BChip text="الحرب مع إيران ما زالت مستمرة" color={color} /> },
        { at: c.month, node: <BChip text="🔥 الشهر التاسع للحرب" color="#c62828" /> },
        { at: c.ships, node: <BChip text="🚢 حركة السفن في مضيق هرمز" color="#1565c0" /> },
        { at: c.stat, node: <BStat value="−65%" label="مقارنة بما قبل الحرب" color="#ff5252" /> },
        { at: c.tanker, node: <BChip text="20 نونبر · اشتعال ناقلة نفط قرب عُمان" color="#c62828" /> },
        { at: c.washington, node: <BChip text="🏛️ مجلس الشيوخ الأمريكي" color="#37474f" /> },
        { at: c.vote, node: <BChip text="رفض تقييد صلاحيات الحرب: 51 مقابل 48" color="#c62828" /> },
        { at: c.question, node: <BChip text="ما الخطوة التالية لواشنطن؟" color="#ffb300" textColor="#111" /> },
      ]} />
    </>
  );
};

// ============ الذكاء الاصطناعي والبورصة ============
export const AiScene: React.FC<{ p: Part; color: string }> = ({ p, color }) => {
  const { t, sp, lin } = useTime();
  const c = p.cues;
  const draw = lin(p.start + 0.3, c.pressure + 1.5);
  const pts = Array.from({ length: 22 }, (_, i) => [40 + i * 35, 90 + i * 14 + Math.sin(i * 1.7) * 30 + (i > 13 ? (i - 13) * 10 : 0)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const P = [{ at: c.price, v: 83, l: 'سعر الطرح', x: 140 }, { at: c.open, v: 111.5, l: 'الافتتاح', x: CX }, { at: c.close, v: 97.17, l: 'الإغلاق', x: 680 }];
  const Y = (v: number) => 400 - (v - 83) * (270 / 28.5);
  return (
    <>
      <ZoneA color={color}>
        <Group from={p.sceneStart} to={c.anthropic}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={30} x2={790} y1={60 + i * 95} y2={60 + i * 95} stroke="#ffffff14" strokeWidth={2} />)}
            <path d={d} stroke="#ff5252" strokeWidth={9} fill="none" strokeLinejoin="round" strokeDasharray={1300} strokeDashoffset={1300 * (1 - draw)} style={{ filter: 'drop-shadow(0 0 12px #ff525288)' }} />
          </svg>
        </Group>
        <Group from={c.anthropic} to={c.price}>
          <At x={CX} y={170}>
            <div style={{ width: 620, padding: '26px 0', borderRadius: 34, background: 'linear-gradient(145deg,#d97757,#8e3b25)', textAlign: 'center', boxShadow: '0 24px 60px #d9775755, inset 0 0 0 3px #ffffff30' }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 84, color: '#fff', direction: 'ltr', lineHeight: 1.1 }}>Anthropic</div>
            </div>
          </At>
          <At at={c.nasdaq} x={CX} y={380}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 54, color: '#fff', direction: 'ltr', whiteSpace: 'nowrap', background: '#1565c0', padding: '10px 34px', borderRadius: 22 }}>
              🔔 NASDAQ · ANT</div>
          </At>
        </Group>
        <Group from={c.price} to={c.question}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {P.slice(1).map((pt, i) => { const a = P[i]; const k = lin(pt.at, pt.at + 0.5);
              return <line key={i} x1={a.x} y1={Y(a.v)} x2={a.x + (pt.x - a.x) * k} y2={Y(a.v) + (Y(pt.v) - Y(a.v)) * k} stroke="#66bb6a" strokeWidth={9} strokeLinecap="round" />; })}
          </svg>
          {P.map((pt, i) => t >= pt.at - 0.02 && (
            <React.Fragment key={i}>
              <At at={pt.at} x={pt.x} y={Y(pt.v)}><div style={{ width: 28, height: 28, borderRadius: 14, background: '#66bb6a', boxShadow: '0 0 0 8px #66bb6a44' }} /></At>
              <At at={pt.at} x={pt.x} y={Y(pt.v) - 58}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, color: '#fff', direction: 'ltr' }}>${pt.v}</div></At>
              <At at={pt.at} x={pt.x} y={Y(pt.v) + 50}><T size={28} color="#c8e6c9">{pt.l}</T></At>
            </React.Fragment>
          ))}
        </Group>
        <Group from={c.question} to={p.sceneEnd}>
          <At x={CX} y={H / 2}>
            <div style={{ width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle at 30% 25%, #ffffffaa, #64b5f633 40%, #8e24aa22 70%)',
              border: '4px solid #ffffff55', transform: `scale(${1 + 0.05 * Math.sin(t * 4)})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <T size={60}>فقاعة؟</T>
            </div>
          </At>
        </Group>
      </ZoneA>
      <ZoneB until={p.sceneEnd} items={[
        { at: p.sceneStart + 0.4, node: <BChip text="💻 التكنولوجيا والمال" color={color} /> },
        { at: c.pressure, node: <BChip text="📉 ضغوط قوية على أسهم الذكاء الاصطناعي" color="#c62828" /> },
        { at: c.anthropic, node: <BChip text="مطوّرة المساعد الذكي Claude" color="#a1502f" /> },
        { at: c.record, node: <BChip text="🏆 أكبر طرح عام في التاريخ" color="#ffb300" textColor="#111" /> },
        { at: c.amount, node: <BStat value="$81.3B" label="حجم الطرح" color="#66bb6a" /> },
        { at: c.price, node: <BChip text="📈 مسار السهم في اليوم الأول" color="#2e7d32" /> },
        { at: c.question, node: <BChip text="هل بلغ الاستثمار مرحلة المبالغة؟" color="#ffb300" textColor="#111" /> },
      ]} />
    </>
  );
};

// ============ سبتة ============
export const CeutaScene: React.FC<{ p: Part; color: string }> = ({ p, color }) => {
  const { lin } = useTime();
  const c = p.cues;
  const coins = Math.floor(lin(c.funding, c.amount + 1.2, 0, 12));
  const folders = Math.floor(lin(c.files, c.files + 1.6, 0, 17));
  return (
    <>
      <ZoneA color={color}>
        <Group from={p.sceneStart} to={c.files}>
          <At x={CX} y={80}><T size={44}>🇪🇸 البرلمان الإسباني</T></At>
          {Array.from({ length: coins }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: CX - 150 + (i % 3) * 150, top: 430 - Math.floor(i / 3) * 62, width: 136, height: 60, borderRadius: '50%',
              transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse at 40% 30%, #fff3b0, #f5b800 50%, #a87400)', boxShadow: '0 8px 0 #7a5400, 0 16px 26px #0008',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 38, color: '#7a5400' }}>€</div>
          ))}
        </Group>
        <Group from={c.files} to={p.sceneEnd}>
          <div style={{ position: 'absolute', left: 60, top: 50, width: 700, height: 400, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignContent: 'center', direction: 'rtl' }}>
            {Array.from({ length: folders }).map((_, i) => <Emoji key={i} e="📁" size={84} />)}
          </div>
        </Group>
      </ZoneA>
      <ZoneB until={p.sceneEnd} items={[
        { at: p.sceneStart + 0.4, node: <BChip text="سبتة وإسبانيا" color={color} /> },
        { at: c.funding, node: <BChip text="✅ مصادقة على تمويل استثنائي" color="#2e7d32" /> },
        { at: c.amount, node: <BStat value="45.3M €" label="لمدينة سبتة" color="#ffd23f" /> },
        { at: c.migrants, node: <BChip text="مرتبط بالدخول الجماعي للمهاجرين في يوليوز" color={color} /> },
        { at: c.files, node: <BStat value="170" label="ملفا لقاصرين مغاربة" color={color} /> },
        { at: c.families, node: <BChip text="✅ العائلات موافقة" color="#2e7d32" /> },
        { at: c.noreply, node: <BChip text="⏳ لا رد حتى الآن" color="#616161" /> },
        { at: c.open, node: <BChip text="📂 الملف ما زال مفتوحا" color={color} /> },
      ]} />
    </>
  );
};

// ============ المناخ ============
export const CopScene: React.FC<{ p: Part; color: string }> = ({ p, color }) => {
  const { t, lin } = useTime();
  const c = p.cues;
  const temp = lin(p.start, p.end, 0.25, 0.95, Easing.linear);
  return (
    <>
      <ZoneA color={color}>
        <Group from={p.sceneStart} to={c.fossil}>
          <At x={360} y={H / 2}><div style={{ transform: `rotate(${t * 6}deg)` }}><Emoji e="🌍" size={330} /></div></At>
          <div style={{ position: 'absolute', left: 640, top: 90, width: 50, height: 320, borderRadius: 25, background: '#fff2', border: '4px solid #fff8' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${temp * 100}%`, borderRadius: 25, background: 'linear-gradient(0deg,#ff1744,#ff9100)' }} />
          </div>
        </Group>
        <Group from={c.fossil} to={c.unnamed}>
          <At x={CX} y={H / 2}><div style={{ display: 'flex', gap: 30 }}><Emoji e="🏭" size={190} /><Emoji e="🛢️" size={190} /></div></At>
        </Group>
        <Group from={c.unnamed} to={p.sceneEnd}>
          <At x={CX} y={H / 2}>
            <div style={{ width: 560, padding: 30, borderRadius: 24, background: '#f5f5f5', boxShadow: '0 20px 60px #0009', direction: 'rtl' }}>
              {[1, 0.8, 0.95, 0.65, 0.9].map((w, i) => <div key={i} style={{ height: 18, width: `${w * 100}%`, marginBottom: 16, borderRadius: 9, background: '#bdbdbd' }} />)}
              <div style={{ position: 'relative', display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#9e9e9e' }}>
                الوقود الأحفوري
                <div style={{ position: 'absolute', left: -6, right: -6, top: '52%', height: 7, background: '#d32f2f', transform: `scaleX(${lin(c.unnamed + 0.3, c.unnamed + 0.8)})`, transformOrigin: 'right' }} />
              </div>
            </div>
          </At>
        </Group>
      </ZoneA>
      <ZoneB until={p.sceneEnd} items={[
        { at: p.sceneStart + 0.3, node: <BChip text="📍 أنطاليا · قمة المناخ COP31" color={color} /> },
        { at: c.deadline, node: <BChip text="⏰ المفاوضات تجاوزت موعدها" color="#c62828" /> },
        { at: c.fossil, node: <BChip text="الخلاف الأكبر: الوقود الأحفوري" color="#455a64" /> },
        { at: c.unnamed, node: <BChip text="النص الأخير لم يذكره بالاسم" color="#6d4c41" /> },
        { at: c.eu, node: <BChip text="🇪🇺 تحذير: قد تنتهي القمة دون اتفاق" color="#1a237e" /> },
      ]} />
    </>
  );
};

// ============ الخاتمة ============
export const OutroScene: React.FC<{ p: Part; color: string; colors: string[] }> = ({ p, color, colors }) => {
  const { t, sp } = useTime();
  const c = p.cues;
  const icons = ['🤝', '🔥', '📈', '🇪🇸', '🌍'];
  return (
    <>
      <ZoneA color={color}>
        <Group from={p.sceneStart} to={c.question}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center', gap: 16, direction: 'rtl' }}>
            {icons.map((e, i) => {
              const s = sp(c.recap + i * 0.4, 10, 180);
              return <div key={i} style={{ width: 140, height: 140, borderRadius: 34, background: `linear-gradient(145deg, ${colors[i]}, ${colors[i]}66)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s}) translateY(${Math.sin(t * 3 + i) * 6}px)`, opacity: Math.min(1, s * 1.5) }}>
                <Emoji e={e} size={78} /></div>;
            })}
          </div>
          <At at={c.recap + 2.2} x={CX} y={360}><T size={58} color="#ffd23f">أسبوع حافل بالأحداث</T></At>
        </Group>
        <Group from={c.question} to={p.sceneEnd}>
          <div style={{ position: 'absolute', inset: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 62, color: '#fff', direction: 'rtl', lineHeight: 1.4 }}>
              أي هذه الأخبار سيكون <span style={{ color: '#ffd23f' }}>الأكثر تأثيرا</span> في الأيام المقبلة؟
            </div>
          </div>
        </Group>
      </ZoneA>
      <ZoneB until={p.sceneEnd + 1} items={[
        { at: p.sceneStart + 0.4, node: <BChip text="خلاصة الأسبوع" color={color} textColor="#111" /> },
        { at: c.comment, node: <BChip text="💬 اكتب رأيك في التعليقات" color="#1e88e5" /> },
        { at: c.follow, node: <BChip text="➕ تابع الصفحة لملخص كل أسبوع" color="#e53935" /> },
      ]} />
    </>
  );
};
