// المشاهد المتحركة لكل خبر — كل حركة مربوطة بلحظة الكلمة ف صوت المذيع (cues)
import React from 'react';
import { Easing } from 'remotion';
import { FONT } from '../theme';
import { Badge, Chip, Counter, Emoji, Label, Pop, useTime } from './kit';

export type Part = { key: string; start: number; end: number; sceneStart: number; sceneEnd: number; cues: Record<string, number> };
const CX = 500; // وسط المنطقة الآمنة

// ===================== المقدمة =====================
export const IntroScene: React.FC<{ p: Part; range: string }> = ({ p, range }) => {
  const { t, sp, lin } = useTime();
  const c = p.cues;
  const title = sp(p.sceneStart + 0.1, 13, 140);
  const shrink = lin(c.summit - 0.3, c.summit + 0.3);
  const gridOut = lin(c.clock - 0.2, c.clock + 0.3);
  const tiles = [
    { at: c.summit, e: '🤝', l: 'قمة تاريخية', col: '#1e88e5' },
    { at: c.iran, e: '🔥', l: 'الشرق الأوسط', col: '#e53935' },
    { at: c.market, e: '📉', l: 'البورصة', col: '#8e24aa' },
    { at: c.ceuta, e: '🇪🇸', l: 'سبتة وإسبانيا', col: '#ef6c00' },
  ];
  return (
    <>
      <div style={{ position: 'absolute', left: CX, top: 620 - shrink * 250, transform: `translate(-50%,-50%) scale(${(0.6 + 0.4 * title) * (1 - shrink * 0.45)})`,
        opacity: Math.min(1, title * 1.5) * (1 - gridOut), textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 150, color: '#fff', lineHeight: 1.05, direction: 'rtl', whiteSpace: 'nowrap',
          textShadow: '0 12px 50px #000' }}>أهم أخبار</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 170, lineHeight: 1.05, direction: 'rtl', whiteSpace: 'nowrap',
          background: 'linear-gradient(90deg,#ffd23f,#ff4f8b)', WebkitBackgroundClip: 'text', color: 'transparent' }}>الأسبوع</div>
      </div>
      {t < c.clock + 0.5 && tiles.map((tl, i) => {
        const s = sp(tl.at, 12, 190);
        if (t < tl.at - 0.05) return null;
        const x = CX + (i % 2 === 0 ? 200 : -200), y = 640 + Math.floor(i / 2) * 270;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: 380, height: 240, borderRadius: 36,
            transform: `translate(-50%,-50%) scale(${(0.4 + 0.6 * s) * (1 - gridOut)}) rotate(${(1 - s) * (i % 2 ? 12 : -12)}deg)`,
            opacity: Math.min(1, s * 1.5) * (1 - gridOut), background: `linear-gradient(145deg, ${tl.col}, ${tl.col}55)`,
            boxShadow: `0 25px 60px ${tl.col}55, inset 0 0 0 2px #ffffff30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Emoji e={tl.e} size={96} />
            <Label size={40}>{tl.l}</Label>
          </div>
        );
      })}
      <Pop at={c.dates} x={CX} y={1060} out={c.clock}><Chip color="#ffb300" size={46}>🗓️ {range}</Chip></Pop>
      {t >= c.clock - 0.1 && (() => {
        const s = sp(c.clock, 10, 160);
        const sweep = lin(c.clock, p.sceneEnd, 0, 1, Easing.linear);
        return (
          <div style={{ position: 'absolute', left: CX, top: 700, transform: `translate(-50%,-50%) scale(${s})` }}>
            <svg width={460} height={460} style={{ position: 'absolute', left: -230, top: -230, transform: 'rotate(-90deg)' }}>
              <circle cx={230} cy={230} r={200} stroke="#ffffff22" strokeWidth={22} fill="#0006" />
              <circle cx={230} cy={230} r={200} stroke="#ffd23f" strokeWidth={22} fill="none" strokeLinecap="round"
                strokeDasharray={1257} strokeDashoffset={1257 * (1 - sweep)} />
            </svg>
            <div style={{ position: 'relative', transform: 'translate(-50%,-50%)', left: 0, top: 0, textAlign: 'center', width: 400 }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 170, color: '#fff', direction: 'ltr', lineHeight: 1 }}>3:00</div>
              <Label size={46} color="#ffd23f">دقايق فقط</Label>
            </div>
          </div>
        );
      })()}
    </>
  );
};

// ===================== القمة =====================
export const SummitScene: React.FC<{ p: Part }> = ({ p }) => {
  const { t, sp, lin } = useTime();
  const c = p.cues;
  const back = lin(c.table - 0.2, c.table + 0.4); // المثلث كيرجع للور ملي كتبان المواضيع
  const weak = lin(c.weak, c.weak + 0.4);
  const q = lin(c.question - 0.2, c.question + 0.3);
  const pts = { xi: [CX, 470], trump: [CX - 230, 800], putin: [CX + 230, 800] } as Record<string, number[]>;
  const leaders = [
    { k: 'trump', e: '🇺🇸', n: 'ترامب' }, { k: 'xi', e: '🇨🇳', n: 'شي جين بينغ' }, { k: 'putin', e: '🇷🇺', n: 'بوتين' },
  ];
  const draw = lin(c.putin + 0.3, c.putin + 1.3);
  const shakeX = weak > 0 && t < c.weak + 0.8 ? Math.sin(t * 60) * 8 * (1 - (t - c.weak) / 0.8) : 0;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shakeX}px, ${-back * 140}px) scale(${1 - back * 0.45})`, transformOrigin: '500px 640px',
        opacity: 1 - q * 0.75 }}>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          {[['xi', 'trump'], ['trump', 'putin'], ['putin', 'xi']].map(([a, b], i) => {
            const [x1, y1] = pts[a], [x2, y2] = pts[b]; const L = Math.hypot(x2 - x1, y2 - y1);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={weak ? '#ff5252' : '#ffd23f'} strokeWidth={8}
              strokeDasharray={weak ? '20 18' : `${L}`} strokeDashoffset={weak ? (t * 60) % 38 : L * (1 - draw)} opacity={0.9} />;
          })}
        </svg>
        {leaders.map((l) => {
          const s = sp(c[l.k], 10, 170);
          if (t < c[l.k] - 0.05) return null;
          const [x, y] = pts[l.k];
          const speaking = t >= c[l.k] && t < c[l.k] + 1.4 ? 1 : 0;
          return (
            <div key={l.k} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.2 + 0.8 * s})`, opacity: Math.min(1, s * 1.5),
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Badge e={l.e} size={210} color="#ffd23f" ring={speaking} />
              <Label size={40}>{l.n}</Label>
            </div>
          );
        })}
        <Pop at={c.city} x={CX} y={690}><Chip color="#e53935" size={40}>📍 شنزن · 19 نونبر</Chip></Pop>
        <Pop at={c.first} x={CX} y={1010} from="up"><Chip color="#ffb300" size={44}>⭐ أول لقاء ثلاثي من نوعو</Chip></Pop>
      </div>
      <div style={{ opacity: 1 - q }}>
        <Pop at={c.nuclear} x={CX} y={790} from="right"><Chip color="#7e57c2" size={50} dim={weak > 0.5}>☢️ الأسلحة النووية</Chip></Pop>
        <Pop at={c.iran} x={CX} y={890} from="left"><Chip color="#e53935" size={50} dim={weak > 0.5}>🔥 الحرب مع إيران</Chip></Pop>
        <Pop at={c.oil} x={CX} y={990} from="right"><Chip color="#455a64" size={50} dim={weak > 0.5}>🛢️ البترول</Chip></Pop>
        <Pop at={c.un} x={CX} y={1090} from="up"><Chip color="#1e88e5" size={44} dim={weak > 0.5}>🇺🇳 إصلاح الأمم المتحدة</Chip></Pop>
        <Pop at={c.weak} x={CX + 140} y={700} rot={-25}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#ff5252', border: '8px solid #ff5252', borderRadius: 20, padding: '4px 26px',
            transform: 'rotate(-10deg)', direction: 'rtl', background: '#0008', whiteSpace: 'nowrap' }}>توافق قليل</div>
        </Pop>
      </div>
      <QuestionMark at={c.question} />
    </>
  );
};

const QuestionMark: React.FC<{ at: number }> = ({ at }) => {
  const { t, sp } = useTime();
  if (t < at - 0.05) return null;
  const s = sp(at, 8, 150);
  return (
    <div style={{ position: 'absolute', left: CX, top: 720, transform: `translate(-50%,-50%) scale(${s * (1 + 0.04 * Math.sin(t * 6))})`,
      fontFamily: FONT, fontWeight: 900, fontSize: 420, lineHeight: 1, color: '#ffd23f', textShadow: '0 0 80px #ffd23f88, 0 20px 0 #0007' }}>؟</div>
  );
};

// ===================== الشرق الأوسط =====================
export const MideastScene: React.FC<{ p: Part }> = ({ p }) => {
  const { t, sp, lin } = useTime();
  const c = p.cues;
  const mapOut = lin(c.washington - 0.2, c.washington + 0.4);
  const reduce = lin(c.stat, c.stat + 1);
  const q = lin(c.question - 0.2, c.question + 0.3);
  const ships = Array.from({ length: 9 });
  return (
    <>
      {/* خريطة مبسطة لمضيق هرمز */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${mapOut * -900}px) rotate(${mapOut * -6}deg)`, opacity: 1 - mapOut }}>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d3b66" /><stop offset="1" stopColor="#0a2540" /></linearGradient>
            <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c9a66b" /><stop offset="1" stopColor="#8d6e45" /></linearGradient>
          </defs>
          <rect x={110} y={400} width={780} height={640} rx={40} fill="url(#sea)" stroke="#ffffff22" strokeWidth={3} />
          <path d="M110 400 H890 V600 C800 640 720 610 640 640 C560 670 470 650 380 610 C300 575 200 600 110 560 Z" fill="url(#land)" opacity={0.95} />
          <path d="M110 1040 V820 C220 800 330 860 440 840 C520 826 560 760 620 740 C660 728 690 760 700 800 C720 880 820 900 890 880 V1040 Z" fill="url(#land)" opacity={0.95} />
          <path d="M620 740 C650 700 680 690 700 700" stroke="#ffd23f" strokeWidth={4} strokeDasharray="10 10" fill="none" />
        </svg>
        <Label size={44} style={{ position: 'absolute', left: 500, top: 470, transform: 'translateX(-50%)' }}>🇮🇷 إيران</Label>
        <Label size={38} style={{ position: 'absolute', left: 300, top: 950, transform: 'translateX(-50%)' }}>شبه الجزيرة العربية</Label>
        <Label size={38} style={{ position: 'absolute', left: 790, top: 960, transform: 'translateX(-50%)' }}>🇴🇲 عُمان</Label>
        <Label size={34} color="#ffd23f" style={{ position: 'absolute', left: 660, top: 655, transform: 'translateX(-50%)' }}>مضيق هرمز</Label>
        {ships.map((_, i) => {
          const keep = i % 3 === 0; // تقريباً ثلث السفن كيبقى (−65%)
          const op = keep ? 1 : 1 - reduce;
          const ph = ((t * 0.08 + i / ships.length) % 1);
          const x = 160 + ph * 700, y = 720 + Math.sin(ph * Math.PI * 2 + i) * 30 - (x > 560 && x < 720 ? 15 : 0);
          return <div key={i} style={{ position: 'absolute', left: x, top: y, opacity: op * 0.95, transform: 'translate(-50%,-50%)' }}><Emoji e="🚢" size={54} /></div>;
        })}
        {t >= c.tanker - 0.05 && (() => {
          const s = sp(c.tanker, 9, 170);
          return (
            <div style={{ position: 'absolute', left: 760, top: 860, transform: `translate(-50%,-50%) scale(${s})` }}>
              <Emoji e="🚢" size={90} />
              <div style={{ position: 'absolute', left: 20, top: -70, transform: `scale(${1 + 0.15 * Math.sin(t * 20)})` }}><Emoji e="🔥" size={80} /></div>
              {[0, 1, 2].map((k) => {
                const ph = (t * 0.7 + k / 3) % 1;
                return <div key={k} style={{ position: 'absolute', left: 40 + ph * 30, top: -80 - ph * 160, width: 50 + ph * 60, height: 50 + ph * 60,
                  borderRadius: '50%', background: '#555', opacity: 0.5 * (1 - ph), filter: 'blur(6px)' }} />;
              })}
            </div>
          );
        })()}
        <Pop at={c.tanker + 0.3} x={760} y={1000}><Chip color="#e53935" size={34}>20 نونبر · ناقلة نفط تحرقات</Chip></Pop>
        <Pop at={c.month} x={CX} y={1100} from="up" out={c.washington - 0.3}><Chip color="#e53935" size={42}>🔥 الشهر التاسع ديال الحرب</Chip></Pop>
        {t >= c.stat - 0.05 && t < c.tanker && (
          <Pop at={c.stat} x={CX} y={560}>
            <div style={{ textAlign: 'center', background: '#000a', borderRadius: 36, padding: '16px 40px', border: '4px solid #ff5252' }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 150, color: '#ff5252', direction: 'ltr', lineHeight: 1 }}>−65%</div>
              <Label size={36}>عبور السفن مقارنة بقبل الحرب</Label>
            </div>
          </Pop>
        )}
      </div>
      {/* واشنطن: تصويت مجلس الشيوخ */}
      {t >= c.washington - 0.1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - q * 0.8 }}>
          <Pop at={c.washington} x={CX} y={560}><Emoji e="🏛️" size={200} /></Pop>
          <Pop at={c.washington + 0.3} x={CX} y={730}><Label size={54}>مجلس الشيوخ الأمريكي</Label></Pop>
          {[{ n: 51, l: 'رفض', col: '#e53935', y: 860 }, { n: 48, l: 'مع القرار', col: '#43a047', y: 980 }].map((b, i) => {
            const w = lin(c.vote + i * 0.3, c.vote + 1 + i * 0.3, 0, b.n / 51);
            if (t < c.vote - 0.1) return null;
            return (
              <div key={i} style={{ position: 'absolute', left: 150, top: b.y, width: 700, height: 90, direction: 'rtl' }}>
                <div style={{ position: 'absolute', right: 0, top: 0, height: 90, width: 560 * w, borderRadius: 18, background: b.col, boxShadow: `0 10px 30px ${b.col}66` }} />
                <div style={{ position: 'absolute', right: 20, top: 8, fontFamily: FONT, fontWeight: 900, fontSize: 52, color: '#fff' }}>{b.l}</div>
                <div style={{ position: 'absolute', left: 0, top: 4, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff', direction: 'ltr' }}>{Math.round(b.n * w / (b.n / 51))}</div>
              </div>
            );
          })}
        </div>
      )}
      <QuestionMark at={c.question} />
    </>
  );
};

// ===================== الذكاء الاصطناعي والبورصة =====================
export const AiScene: React.FC<{ p: Part }> = ({ p }) => {
  const { t, sp, lin } = useTime();
  const c = p.cues;
  const chartOut = lin(c.anthropic - 0.2, c.anthropic + 0.3);
  const draw = lin(p.start + 0.5, c.pressure + 1.2);
  const ladderIn = lin(c.price - 0.2, c.price + 0.3);
  const q = lin(c.question - 0.2, c.question + 0.3);
  // منحنى نازل (أسهم التكنولوجيا)
  const pts = Array.from({ length: 24 }, (_, i) => [140 + i * 31, 560 + i * 14 + Math.sin(i * 1.7) * 38 + (i > 14 ? (i - 14) * 12 : 0)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - chartOut, transform: `scale(${1 + chartOut * 0.2})` }}>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={130} x2={880} y1={520 + i * 110} y2={520 + i * 110} stroke="#ffffff14" strokeWidth={2} />)}
          <path d={d} stroke="#ff5252" strokeWidth={10} fill="none" strokeLinejoin="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - draw)}
            style={{ filter: 'drop-shadow(0 0 14px #ff525288)' }} />
        </svg>
        <Pop at={p.start + 0.3} x={CX} y={460}><Label size={50}>💻 أسهم التكنولوجيا</Label></Pop>
        <Pop at={c.pressure} x={720} y={1000}><Chip color="#e53935" size={42}>📉 Nasdaq: كثر من −10%</Chip></Pop>
      </div>
      {t >= c.anthropic - 0.1 && (
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-ladderIn * 120}px) scale(${1 - ladderIn * 0.2})`, transformOrigin: '500px 560px', opacity: 1 - ladderIn }}>
          <Pop at={c.anthropic} x={CX} y={560}>
            <div style={{ width: 600, padding: '30px 0', borderRadius: 40, background: 'linear-gradient(145deg,#d97757,#8e3b25)', textAlign: 'center',
              boxShadow: '0 30px 80px #d9775766, inset 0 0 0 3px #ffffff30' }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 84, color: '#fff', direction: 'ltr' }}>Anthropic</div>
              <Label size={38} color="#ffe0d6">مولات المساعد الذكي Claude</Label>
            </div>
          </Pop>
          <Pop at={c.nasdaq} x={CX} y={780} from="up">
            <Chip color="#1565c0" size={46}><span style={{ direction: 'ltr', display: 'inline-block' }}>🔔 NASDAQ · ANT</span></Chip>
          </Pop>
          <Pop at={c.record} x={CX} y={900} from="up"><Chip color="#ffb300" size={42}>🏆 أكبر اكتتاب ف التاريخ</Chip></Pop>
          {t >= c.amount - 0.1 && t < c.price + 0.3 && (
            <Pop at={c.amount} x={CX} y={1030}>
              <Counter at={c.amount} to={81.3} fmt={(n) => `$${n.toFixed(1)}B`} size={140} color="#66bb6a" glow="#66bb6a88" />
            </Pop>
          )}
        </div>
      )}
      {/* مسار ثمن السهم */}
      {t >= c.price - 0.1 && (() => {
        const P = [{ at: c.price, v: 83, l: 'ثمن الطرح' }, { at: c.open, v: 111.5, l: 'الافتتاح' }, { at: c.close, v: 97.17, l: 'الإغلاق' }];
        const Y = (v: number) => 1080 - (v - 70) * 7;
        return (
          <div style={{ position: 'absolute', inset: 0, opacity: 1 - q * 0.85 }}>
            <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
              {P.slice(1).map((pt, i) => {
                const a = P[i]; const x1 = 230 + i * 270, x2 = 230 + (i + 1) * 270; const k = lin(pt.at, pt.at + 0.5);
                return <line key={i} x1={x1} y1={Y(a.v)} x2={x1 + (x2 - x1) * k} y2={Y(a.v) + (Y(pt.v) - Y(a.v)) * k} stroke="#66bb6a" strokeWidth={10} strokeLinecap="round" />;
              })}
            </svg>
            {P.map((pt, i) => (
              <Pop key={i} at={pt.at} x={230 + i * 270} y={Y(pt.v)}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transform: 'translateY(-50px)' }}>
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', direction: 'ltr' }}>${pt.v}</div>
                  <div style={{ width: 30, height: 30, borderRadius: 15, background: '#66bb6a', boxShadow: '0 0 0 8px #66bb6a44' }} />
                  <Label size={32} color="#c8e6c9">{pt.l}</Label>
                </div>
              </Pop>
            ))}
          </div>
        );
      })()}
      {t >= c.question - 0.1 && (() => {
        const s = sp(c.question, 8, 120);
        return (
          <div style={{ position: 'absolute', left: CX, top: 720, transform: `translate(-50%,-50%) scale(${s * (1 + 0.05 * Math.sin(t * 4))})`, width: 420, height: 420,
            borderRadius: '50%', background: 'radial-gradient(circle at 30% 25%, #ffffffaa, #64b5f633 40%, #8e24aa22 70%)', border: '4px solid #ffffff55',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Label size={64}>فقاعة؟ 🫧</Label>
          </div>
        );
      })()}
    </>
  );
};

// ===================== سبتة =====================
export const CeutaScene: React.FC<{ p: Part }> = ({ p }) => {
  const { t, lin } = useTime();
  const c = p.cues;
  const moneyOut = lin(c.files - 0.2, c.files + 0.3);
  const coins = Math.floor(lin(c.funding, c.amount + 1.2, 0, 9));
  const folders = Math.floor(lin(c.files, c.files + 1.6, 0, 17));
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - moneyOut, transform: `translateX(${moneyOut * 700}px)` }}>
        <Pop at={p.start + 0.2} x={CX} y={460}><Label size={52}>🇪🇸 البرلمان الإسباني</Label></Pop>
        {Array.from({ length: coins }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: CX - 140 + (i % 3) * 140, top: 820 - Math.floor(i / 3) * 70, width: 130, height: 60, borderRadius: '50%',
            transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse at 40% 30%, #fff3b0, #f5b800 50%, #a87400)', boxShadow: '0 8px 0 #7a5400, 0 18px 30px #0008',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#7a5400' }}>€</div>
        ))}
        {t >= c.amount - 0.1 && (
          <Pop at={c.amount} x={CX} y={1000}>
            <Counter at={c.amount} to={45.3} fmt={(n) => `${n.toFixed(1)}M €`} size={130} color="#ffd23f" glow="#ffd23f66" />
          </Pop>
        )}
        <Pop at={c.funding + 0.4} x={CX} y={560} from="up"><Chip color="#43a047" size={40}>✅ تمويل استثنائي لسبتة</Chip></Pop>
        <Pop at={c.migrants} x={CX} y={1110} from="up"><Chip color="#ef6c00" size={36}>📍 مرتبط بالدخول الجماعي ف يوليوز</Chip></Pop>
      </div>
      {t >= c.files - 0.1 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', left: CX, top: 700, width: 640, transform: 'translate(-50%,-50%)', display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', direction: 'rtl' }}>
            {Array.from({ length: folders }).map((_, i) => <Emoji key={i} e="📁" size={74} />)}
          </div>
          <Pop at={c.files} x={CX} y={460}>
            <Counter at={c.files} to={170} dur={1.6} fmt={(n) => `${Math.round(n)}`} size={140} color="#fff" glow="#ef6c0088" />
          </Pop>
          <Pop at={c.files + 0.5} x={CX} y={560}><Label size={40}>ملف ديال قاصرين مغاربة</Label></Pop>
          <Pop at={c.families} x={CX - 170} y={1000} from="right"><Chip color="#43a047" size={38}>👨‍👩‍👦 العائلات موافقة</Chip></Pop>
          <Pop at={c.noreply} x={CX + 170} y={1000} from="left"><Chip color="#757575" size={38}>✉️ بلا رد ⏳</Chip></Pop>
          <Pop at={c.open} x={CX} y={1110} from="up"><Chip color="#ef6c00" size={40}>📂 الملف مازال مفتوح</Chip></Pop>
        </div>
      )}
    </>
  );
};

// ===================== المناخ =====================
export const CopScene: React.FC<{ p: Part }> = ({ p }) => {
  const { t, sp, lin } = useTime();
  const c = p.cues;
  const temp = lin(p.start, p.end, 0.2, 0.95, Easing.linear);
  const globeMove = lin(c.fossil - 0.2, c.fossil + 0.4);
  return (
    <>
      <div style={{ position: 'absolute', left: CX - globeMove * 230, top: 690 - globeMove * 120, transform: `translate(-50%,-50%) scale(${(0.3 + 0.7 * sp(p.sceneStart + 0.2, 12, 120)) * (1 - globeMove * 0.45)})` }}>
        <div style={{ transform: `rotate(${t * 6}deg)` }}><Emoji e="🌍" size={380} /></div>
        <div style={{ position: 'absolute', right: -90, top: 30, width: 54, height: 330, borderRadius: 27, background: '#fff2', border: '4px solid #fff8' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${temp * 100}%`, borderRadius: 27, background: 'linear-gradient(0deg,#ff1744,#ff9100)' }} />
        </div>
      </div>
      <Pop at={c.turkey + 0.2} x={CX} y={1010} out={c.fossil - 0.2}><Chip color="#2e7d32" size={46}>📍 أنطاليا 🇹🇷 · COP31</Chip></Pop>
      <Pop at={c.deadline} x={CX} y={450} out={c.fossil - 0.2}><Chip color="#e53935" size={42}>⏰ فاتت الموعد المحدد</Chip></Pop>
      {t >= c.fossil - 0.1 && (
        <>
          <Pop at={c.fossil} x={CX + 180} y={570}><div style={{ display: 'flex', gap: 10 }}><Emoji e="🏭" size={150} /><Emoji e="🛢️" size={150} /></div></Pop>
          <Pop at={c.fossil + 0.3} x={CX + 180} y={690}><Label size={44}>الوقود الأحفوري</Label></Pop>
          <Pop at={c.unnamed} x={CX} y={910}>
            <div style={{ width: 520, padding: 26, borderRadius: 24, background: '#f5f5f5', boxShadow: '0 20px 60px #0009', direction: 'rtl' }}>
              {[1, 0.8, 0.95, 0.6].map((w, i) => <div key={i} style={{ height: 18, width: `${w * 100}%`, marginBottom: 14, borderRadius: 9, background: i === 2 ? '#ffcdd2' : '#bdbdbd' }} />)}
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 38, color: '#c62828', whiteSpace: 'nowrap' }}>✗ بلا ذكر الوقود الأحفوري</div>
            </div>
          </Pop>
          <Pop at={c.eu} x={CX} y={1090} from="up"><Chip color="#1a237e" size={42}>🇪🇺 تحذير: ممكن بلا اتفاق ⚠️</Chip></Pop>
        </>
      )}
    </>
  );
};

// ===================== الخاتمة =====================
export const OutroScene: React.FC<{ p: Part; colors: string[] }> = ({ p, colors }) => {
  const { t, sp, lin } = useTime();
  const c = p.cues;
  const up = lin(c.question - 0.3, c.question + 0.3);
  const icons = ['🤝', '🔥', '📈', '🇪🇸', '🌍'];
  return (
    <>
      <div style={{ position: 'absolute', left: CX, top: 640 - up * 180, transform: `translate(-50%,-50%) scale(${1 - up * 0.35})`, display: 'flex', gap: 18, direction: 'rtl' }}>
        {icons.map((e, i) => {
          const s = sp(c.recap + i * 0.35, 10, 180);
          return <div key={i} style={{ width: 140, height: 140, borderRadius: 36, background: `linear-gradient(145deg, ${colors[i]}, ${colors[i]}66)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s}) translateY(${Math.sin(t * 3 + i) * 8}px)`, boxShadow: `0 20px 50px ${colors[i]}55` }}>
            <Emoji e={e} size={80} /></div>;
        })}
      </div>
      <Pop at={c.recap + 2} x={CX} y={830} out={c.question - 0.3}><Label size={62} color="#ffd23f">سيمانة عامرة بالأحداث 🔥</Label></Pop>
      <Pop at={c.question} x={CX} y={760}>
        <div style={{ width: 760, padding: '30px 30px', borderRadius: 36, background: '#000a', border: '5px solid #ffd23f', textAlign: 'center' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 60, color: '#fff', direction: 'rtl', lineHeight: 1.35 }}>
            شنو هو الخبر اللي غادي يكون عندو <span style={{ color: '#ffd23f' }}>أكبر تأثير</span>؟
          </div>
        </div>
      </Pop>
      <Pop at={c.comment} x={CX} y={1000} from="up"><Chip color="#1e88e5" size={50}>💬 كتب رأيك ف التعليقات</Chip></Pop>
      {t >= c.follow - 0.05 && (
        <Pop at={c.follow} x={CX} y={1110} from="up">
          <div style={{ transform: `scale(${1 + 0.05 * Math.sin(t * 8)})` }}><Chip color="#e53935" size={50}>➕ تابع الصفحة</Chip></div>
        </Pop>
      )}
    </>
  );
};
