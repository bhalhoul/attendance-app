// إعلان QRVE (qrve.click) — بطاقات QR للتقييمات في Google، Instagram والمينيو. نسخة دارجة + نسخة إسبانية من نفس القالب.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion';
import { FONT } from '../theme';
import { clampX, Emoji, FPS, useTime } from '../weeklypro/kit';

type Word = { w: string; start: number; end: number };
type Phrase = { words: Word[]; start: number; end: number };
type Part = { key: string; color: string; text: string; start: number; end: number; sceneStart: number; sceneEnd: number;
  audio: string; words: Word[]; phrases: Phrase[]; cues: Record<string, number> };
export type QrveTimeline = { id: string; lang: 'ar' | 'es'; durationSec: number; parts: Part[]; qr: { size: number; data: number[] } };
export type QrveProps = { tl: QrveTimeline; withAudio: boolean };

const L = {
  ar: {
    biz: ['☕ قهوة', '🍽️ ريسطورون', '🛍️ حانوت'], ceuta: '📍 سبتة', reviews: (n: number) => `${n} تقييم`, noReviews: 'حتى تقييم 😕',
    happy: 'الكليان فرحانين 😍', search: 'قهوة قريبة مني', lazy: 'كيتكاسلو يقلبو 😴',
    cardG: 'قيّمنا فـ Google', cardGsub: 'سكاني الكود ⭐', cardI: 'تبعنا فـ Instagram', cardM: 'المينيو', scan: 'سكان بالكاميرا 📷',
    write: 'اكتب التقييم ديالك', post: 'نشر', follow: 'تبع', following: 'كتبعو ✓', menu: [['قهوة نص نص', '1,50 €'], ['أتاي بالنعناع', '1,80 €'], ['كرواسون', '1,20 €'], ['عصير الليمون', '2,50 €']],
    price: 'غير', once: 'كتخلص مرة وحدة', nosub: 'بلا اشتراك', ship: 'التوصيل فابور 🚚', custom: '🎨 بالّوغو ديالك؟ عندنا حتى المخصص',
    wa: 'صيفط لينا فالواتساب', slogan: 'قرّب، دير سكان… وكليان جديد', tap: '📲 قرّب التيليفون… وصافي!', orScan: '📷 ولا دير سكان للكود QR', size: '9×13 سم', yourBiz: 'المحل ديالك',
  },
  es: {
    biz: ['☕ Bar', '🍽️ Restaurante', '🛍️ Tienda'], ceuta: '📍 Ceuta', reviews: (n: number) => `${n} reseñas`, noReviews: 'Sin reseñas 😕',
    happy: 'Clientes contentos 😍', search: 'cafetería cerca de mí', lazy: 'Les da pereza buscarte 😴',
    cardG: 'Valóranos en Google', cardGsub: 'Escanea el código ⭐', cardI: 'Síguenos en Instagram', cardM: 'MENÚ', scan: 'Escanea con la cámara 📷',
    write: 'Escribe tu reseña', post: 'Publicar', follow: 'Seguir', following: 'Siguiendo ✓', menu: [['Café con leche', '1,50 €'], ['Té moruno', '1,80 €'], ['Croissant', '1,20 €'], ['Zumo natural', '2,50 €']],
    price: 'Solo', once: 'Pago único', nosub: 'Sin suscripción', ship: 'Envío gratis 🚚', custom: '🎨 ¿Con tu logo? También personalizada',
    wa: 'Escríbenos por WhatsApp', slogan: 'Acerca, escanea… ¡cliente nuevo!', tap: '📲 Acerca el móvil… ¡y listo!', orScan: '📷 O escanea el código QR', size: '9×13 cm', yourBiz: 'Tu negocio',
  },
};

// المنصة: x 90–910 / y 250–1460 (آمنة لـ TikTok و Reels). المسرح فوق، الترجمة تحت.
const STAGE = { top: 350, h: 840, cx: 500 };
const CAP = { top: 1215, h: 230, left: 90, w: 820 };

// ---------- عناصر صغيرة ----------
const Qr: React.FC<{ qr: QrveTimeline['qr']; px: number; fg?: string; bg?: string }> = ({ qr, px, fg = '#111', bg = '#fff' }) => {
  const n = qr.size, q = 2, cell = px / (n + q * 2);
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.data[y * n + x]) rects.push(<rect key={y * n + x} x={(x + q) * cell} y={(y + q) * cell} width={cell + 0.3} height={cell + 0.3} fill={fg} />);
  return <svg width={px} height={px} style={{ display: 'block', borderRadius: px * 0.06, background: bg }}>{rects}</svg>;
};
const Stars: React.FC<{ n?: number; size: number; fill?: number; color?: string }> = ({ n = 5, size, fill = 5, color = '#FBBC05' }) => (
  <div style={{ display: 'flex', gap: size * 0.12, direction: 'ltr' }}>
    {Array.from({ length: n }, (_, i) => {
      const f = Math.max(0, Math.min(1, fill - i));
      return <div key={i} style={{ position: 'relative', fontSize: size, lineHeight: 1, color: '#d6d6d6' }}>★
        <div style={{ position: 'absolute', inset: 0, width: `${f * 100}%`, overflow: 'hidden', color, transform: `scale(${1 + 0.25 * f * (1 - f) * 4})` }}>★</div></div>;
    })}
  </div>
);
const GoogleWord: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: size, direction: 'ltr', letterSpacing: -size * 0.02 }}>
    {['#4285F4', '#EA4335', '#FBBC05', '#4285F4', '#34A853', '#EA4335'].map((c, i) => <span key={i} style={{ color: c }}>{'Google'[i]}</span>)}
  </div>
);
const IgGlyph: React.FC<{ size: number; color?: string }> = ({ size, color = '#fff' }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.3, border: `${size * 0.09}px solid ${color}`, position: 'relative', boxSizing: 'border-box' }}>
    <div style={{ position: 'absolute', left: '50%', top: '50%', width: size * 0.42, height: size * 0.42, borderRadius: '50%', border: `${size * 0.09}px solid ${color}`, transform: 'translate(-50%,-50%)', boxSizing: 'border-box' }} />
    <div style={{ position: 'absolute', right: size * 0.12, top: size * 0.12, width: size * 0.1, height: size * 0.1, borderRadius: '50%', background: color }} />
  </div>
);
const IG_GRAD = 'linear-gradient(45deg,#feda75,#fa7e1e 25%,#d62976 50%,#962fbf 75%,#4f5bd5)';

// علامة NFC (موجات) ف زاوية البطاقة
const NfcWaves: React.FC<{ size: number; color: string; phase?: number }> = ({ size, color, phase = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: 'block' }}>
    {[9, 16, 23].map((r, i) => { const a = Math.PI / 4, cx0 = 6, cy0 = 20;
      return <path key={r} d={`M ${cx0 + r * Math.cos(-a)} ${cy0 + r * Math.sin(-a)} A ${r} ${r} 0 0 1 ${cx0 + r * Math.cos(a)} ${cy0 + r * Math.sin(a)}`}
        fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" opacity={phase ? 0.35 + 0.65 * Math.max(0, Math.sin(phase - i * 0.9)) : 1} />; })}
  </svg>
);
const NfcMark: React.FC<{ w: number; color: string }> = ({ w, color }) => (
  <div style={{ position: 'absolute', top: w * 0.035, right: w * 0.04, display: 'flex', alignItems: 'center', gap: 2, direction: 'ltr' }}>
    <NfcWaves size={w * 0.1} color={color} />
    <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: w * 0.05, color }}>NFC</div>
  </div>
);

// البطاقة 9×13
const Card: React.FC<{ kind: 'google' | 'insta' | 'menu'; qr: QrveTimeline['qr']; lang: 'ar' | 'es'; w?: number }> = ({ kind, qr, lang, w = 340 }) => {
  const h = w * 13 / 9, T = L[lang];
  const base: React.CSSProperties = { width: w, height: h, borderRadius: w * 0.07, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
    padding: `${w * 0.09}px ${w * 0.07}px`, boxSizing: 'border-box', boxShadow: '0 40px 80px #000a, 0 0 0 2px #ffffff22', fontFamily: FONT, position: 'relative' };
  if (kind === 'google') return (
    <div style={{ ...base, background: '#fff' }}><NfcMark w={w} color="#1a73e8" />
      <GoogleWord size={w * 0.2} />
      <Stars size={w * 0.12} />
      <Qr qr={qr} px={w * 0.62} />
      <div style={{ fontWeight: 900, fontSize: w * 0.085, color: '#202124', direction: lang === 'ar' ? 'rtl' : 'ltr', whiteSpace: 'nowrap' }}>{T.cardG}</div>
    </div>);
  if (kind === 'insta') return (
    <div style={{ ...base, background: IG_GRAD }}><NfcMark w={w} color="#fff" />
      <IgGlyph size={w * 0.22} />
      <div style={{ fontWeight: 900, fontSize: w * 0.085, color: '#fff', direction: lang === 'ar' ? 'rtl' : 'ltr', whiteSpace: 'nowrap' }}>{T.cardI}</div>
      <Qr qr={qr} px={w * 0.62} />
      <div style={{ fontWeight: 800, fontSize: w * 0.07, color: '#fff', direction: 'ltr' }}>@tu_negocio</div>
    </div>);
  return (
    <div style={{ ...base, background: 'linear-gradient(160deg,#2b1d14,#120c08)' }}><NfcMark w={w} color="#ffcf87" />
      <div style={{ fontSize: w * 0.2, fontFamily: "'Noto Color Emoji'" }}>🍽️</div>
      <div style={{ fontWeight: 900, fontSize: w * 0.12, color: '#ffcf87', letterSpacing: 2 }}>{T.cardM}</div>
      <Qr qr={qr} px={w * 0.62} fg="#120c08" bg="#ffe9c7" />
      <div style={{ fontWeight: 800, fontSize: w * 0.065, color: '#ffcf87', direction: 'ltr' }}>QR · menú digital</div>
    </div>);
};

const Phone: React.FC<{ w?: number; children: React.ReactNode }> = ({ w = 330, children }) => (
  <div style={{ width: w, height: w * 2.05, borderRadius: w * 0.14, background: '#0d0d10', padding: w * 0.035, boxSizing: 'border-box', boxShadow: '0 50px 90px #000c, inset 0 0 0 3px #3a3a44' }}>
    <div style={{ width: '100%', height: '100%', borderRadius: w * 0.11, background: '#fff', overflow: 'hidden', position: 'relative', fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: '50%', top: w * 0.03, width: w * 0.3, height: w * 0.07, borderRadius: 99, background: '#0d0d10', transform: 'translateX(-50%)', zIndex: 5 }} />
      {children}
    </div>
  </div>
);

const Logo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.25, direction: 'ltr' }}>
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: 'linear-gradient(135deg,#4285F4,#34A853)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: size * 0.1, padding: size * 0.16, boxSizing: 'border-box' }}>
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ borderRadius: size * 0.06, background: i === 3 ? '#FBBC05' : '#fff' }} />)}
    </div>
    <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: size * 0.72, color: '#fff', letterSpacing: -1 }}>QRVE</div>
  </div>
);

const Txt: React.FC<{ size: number; color?: string; lang: 'ar' | 'es'; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, color = '#fff', lang, children, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color, direction: lang === 'ar' ? 'rtl' : 'ltr', whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.2, textShadow: '0 6px 24px #000b', ...style }}>{children}</div>
);

// عنصر يظهر بنابض
const In: React.FC<{ at: number; x: number; y: number; out?: number; from?: 'up' | 'zoom' | 'left' | 'right'; children: React.ReactNode }> = ({ at, x, y, out, from = 'zoom', children }) => {
  const { t, sp, lin } = useTime();
  if (t < at - 0.03) return null;
  const s = sp(at, 12, 180), o = out !== undefined ? lin(out, out + 0.3, 1, 0) : 1;
  if (o <= 0) return null;
  const d = 1 - s;
  const tr = from === 'zoom' ? `scale(${0.4 + 0.6 * s})` : from === 'up' ? `translateY(${d * 160}px)` : `translateX(${(from === 'left' ? -1 : 1) * d * 400}px)`;
  return <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) ${tr}`, opacity: Math.min(1, s * 1.5) * o }}>{children}</div>;
};

// ---------- المشاهد ----------
const Scene: React.FC<{ p: Part; tl: QrveTimeline }> = ({ p, tl }) => {
  const { t, sp, lin } = useTime();
  const T = L[tl.lang], c = p.cues ?? {}, lang = tl.lang;
  const S0 = p.sceneStart, Y = STAGE.top, cx = STAGE.cx;
  switch (p.key) {
    case 'hook': {
      const sad = c.sadAt ?? p.end - 2;
      return (<>
        {T.biz.map((b, i) => <In key={i} at={S0 + 0.05 + i * 0.35} x={cx + (i - 1) * 270} y={Y + 70} from="up">
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 38, color: '#fff', background: '#ffffff18', border: '2px solid #ffffff30', padding: '8px 22px', borderRadius: 40, whiteSpace: 'nowrap', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>{b}</div>
        </In>)}
        <In at={S0 + 0.3} x={cx} y={Y + 330}><div style={{ display: 'flex', gap: 20 }}><Emoji e="☕" size={180} /><Emoji e="🥐" size={180} /></div></In>
        <In at={S0 + 1.2} x={cx} y={Y + 560} out={sad - 0.2}><Txt size={60} lang={lang} color="#7CFC9A">{T.happy}</Txt></In>
        <In at={sad} x={cx} y={Y + 610}>
          <div style={{ background: '#fff', borderRadius: 30, padding: '22px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: '0 30px 60px #000a',
            transform: `rotate(${Math.sin(t * 18) * 3 * Math.max(0, 1 - (t - sad) * 1.5)}deg)` }}>
            <GoogleWord size={64} />
            <Stars size={60} fill={0} />
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 42, color: '#EA4335', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>{T.noReviews}</div>
          </div>
        </In>
      </>);
    }
    case 'problem': {
      const st = c.starsAt ?? S0 + 1, lz = c.lazyAt ?? p.end - 2;
      const row = (name: string, score: number | null, n: number, hi: boolean) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px', borderBottom: '1px solid #eee', background: hi ? '#e8f0fe' : '#fff', direction: 'ltr' }}>
          <div style={{ width: 70, height: 70, borderRadius: 14, background: hi ? '#4285F4' : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontFamily: "'Noto Color Emoji'" }}>☕</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 30, color: '#202124' }}>{name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Arial, sans-serif', fontSize: 26, color: '#70757a' }}>
              {score !== null ? <><b style={{ color: '#202124' }}>{score.toFixed(1)}</b><Stars size={24} fill={score * lin(st, st + 1)} /> ({n})</> : <>— <Stars size={24} fill={0} /> (0)</>}
            </div>
          </div>
        </div>);
      return (<>
        <In at={S0 + 0.05} x={cx - 140} y={Y + 410} from="left">
          <Phone w={360}>
            <div style={{ padding: '70px 16px 14px', background: '#fff' }}>
              <div style={{ border: '2px solid #dfe1e5', borderRadius: 40, padding: '12px 20px', fontFamily: lang === 'ar' ? FONT : 'Arial, sans-serif', fontSize: 24, color: '#202124', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>🔍 {T.search}</div>
            </div>
            {row('Café Central', 4.8, 236, true)}
            {row('Café Plaza', 4.6, 154, false)}
            {row(T.yourBiz, null, 0, false)}
          </Phone>
        </In>
        <In at={st} x={cx + 250} y={Y + 200}><Emoji e="⭐" size={150} /></In>
        <In at={lz} x={cx + 230} y={Y + 560}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Emoji e="😴" size={150} />
            <Txt size={36} lang={lang} style={{ whiteSpace: 'normal', width: 300 }}>{T.lazy}</Txt>
          </div>
        </In>
      </>);
    }
    case 'google': {
      const ca = Math.min(c.cardAt ?? S0 + 0.5, S0 + 0.3), nf = c.nfcAt ?? ca + 1.5, tp = c.tapAt ?? nf + 1, sc = c.scanAt ?? tp + 1.5, op = c.openAt ?? sc + 1.2;
      const ph = sp(tp - 0.45, 14, 120); // التيليفون كيتقرب للبطاقة (NFC)
      const touched = t >= tp + 0.15;
      const opened = t >= op;
      const fill = interpolate(t, [op + 0.3, op + 1.6], [0, 5], clampX);
      const ripple = (k: number) => ((t - tp - 0.15 - k * 0.35) % 1.05 + 1.05) % 1.05;
      return (<>
        <In at={S0 + 0.05} x={cx} y={Y + 40} out={tp - 0.6}><Logo size={70} /></In>
        <In at={ca} x={cx - 150 * ph} y={Y + 440} from="up">
          <div style={{ position: 'relative' }}>
            <Card kind="google" qr={tl.qr} lang={lang} w={360} />
            <div style={{ position: 'absolute', left: -60, bottom: -70, fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#fff', background: '#ffffff22', padding: '6px 18px', borderRadius: 20, direction: lang === 'ar' ? 'rtl' : 'ltr' }}>{T.size}</div>
            {touched && !opened && [0, 1, 2].map((k) => <div key={k} style={{ position: 'absolute', left: '82%', top: '12%', width: 40 + ripple(k) * 420, height: 40 + ripple(k) * 420, borderRadius: '50%',
              border: '6px solid #4285F4', transform: 'translate(-50%,-50%)', opacity: 0.8 * (1 - ripple(k)) }} />)}
          </div>
        </In>
        <In at={nf} x={cx + 250} y={Y + 150} out={tp - 0.5}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1a73e8', padding: '10px 26px', borderRadius: 30, boxShadow: '0 16px 40px #1a73e888' }}>
            <NfcWaves size={52} color="#fff" phase={t * 6} /><div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 46, color: '#fff' }}>NFC</div>
          </div>
        </In>
        {t >= tp - 0.45 && (
          <div style={{ position: 'absolute', left: cx + 470 - 330 * ph, top: Y + 400 - 40 * ph, transform: `translate(-50%,-50%) rotate(${(1 - ph) * 25 - 8 * ph}deg)`, opacity: Math.min(1, ph * 2) }}>
            <Phone w={330}>
              {!opened ? (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1b2a4a,#0b1020)' }}>
                  <div style={{ position: 'absolute', top: 90, width: '100%', textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 64, color: '#fff' }}>12:30</div>
                  {touched && <div style={{ position: 'absolute', left: 16, right: 16, top: 200, background: '#ffffffee', borderRadius: 22, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'center',
                    transform: `translateY(${(1 - sp(tp + 0.15, 12, 200)) * -80}px)`, opacity: sp(tp + 0.15, 12, 200) }}>
                    <NfcWaves size={40} color="#1a73e8" />
                    <div style={{ display: 'flex', flexDirection: 'column', direction: 'ltr' }}>
                      <b style={{ fontFamily: 'Arial, sans-serif', fontSize: 22, color: '#111' }}>NFC · Google</b>
                      <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 18, color: '#555' }}>g.page/review ↗</span>
                    </div>
                  </div>}
                </div>
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 26, boxSizing: 'border-box' }}>
                  <GoogleWord size={56} />
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, fontFamily: "'Noto Color Emoji'" }}>☕</div>
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#202124', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>{T.yourBiz}</div>
                  <Stars size={46} fill={fill} />
                  <div style={{ width: '100%', height: 120, borderRadius: 14, border: '2px solid #dadce0', fontFamily: FONT, fontSize: 22, color: '#5f6368', padding: 12, boxSizing: 'border-box', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>{T.write}</div>
                  <div style={{ background: '#1a73e8', color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 28, padding: '10px 40px', borderRadius: 30, transform: `scale(${1 + 0.08 * sp(op + 1.8, 8, 200)})` }}>{T.post}</div>
                </div>
              )}
            </Phone>
          </div>
        )}
        <In at={tp + 0.2} x={cx} y={Y + 830} out={sc - 0.2}><Txt size={40} lang={lang} color="#8ab4ff">{T.tap}</Txt></In>
        <In at={sc} x={cx} y={Y + 830}><Txt size={40} lang={lang} color="#7CFC9A">{T.orScan}</Txt></In>
        {opened && <In at={op + 1.7} x={cx} y={Y + 40}><div style={{ background: '#34A853', color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 44, padding: '8px 26px', borderRadius: 30, direction: 'ltr' }}>+1 ⭐⭐⭐⭐⭐</div></In>}
      </>);
    }
    case 'social': {
      const fo = c.followAt ?? S0 + 2, mn = c.menuAt ?? p.end - 4, pr = c.pricesAt ?? mn + 1;
      const followed = t >= fo + 0.6;
      return (<>
        <In at={S0 + 0.05} x={cx - 190} y={Y + 300} from="left" out={mn - 0.4}><Card kind="insta" qr={tl.qr} lang={lang} w={320} /></In>
        <In at={S0 + 0.5} x={cx + 200} y={Y + 360} out={mn - 0.4}>
          <Phone w={300}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 16px', gap: 18 }}>
              <div style={{ width: 110, height: 110, borderRadius: '50%', padding: 5, background: IG_GRAD }}><div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, fontFamily: "'Noto Color Emoji'" }}>☕</div></div>
              <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 26, color: '#111' }}>@tu_negocio</div>
              <div style={{ display: 'flex', gap: 24, fontFamily: 'Arial, sans-serif', fontSize: 20, color: '#111', direction: 'ltr' }}>
                <div style={{ textAlign: 'center' }}><b style={{ fontSize: 26 }}>{followed ? '1.248' : '1.247'}</b><br />followers</div>
                <div style={{ textAlign: 'center' }}><b style={{ fontSize: 26 }}>96</b><br />posts</div>
              </div>
              <div style={{ width: '85%', textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 28, padding: '10px 0', borderRadius: 12, color: followed ? '#111' : '#fff', background: followed ? '#efefef' : '#0095f6',
                transform: `scale(${t >= fo && t < fo + 0.6 ? 0.92 : 1})` }}>{followed ? T.following : T.follow}</div>
            </div>
          </Phone>
        </In>
        {t >= fo && t < fo + 0.9 && <In at={fo} x={cx + 280} y={Y + 560}><Emoji e="👆" size={110} /></In>}
        <In at={mn} x={cx - 190} y={Y + 360} from="left"><Card kind="menu" qr={tl.qr} lang={lang} w={320} /></In>
        <In at={mn + 0.4} x={cx + 200} y={Y + 380}>
          <Phone w={300}>
            <div style={{ padding: '80px 18px', display: 'flex', flexDirection: 'column', gap: 12, background: '#fff8ee', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#2b1d14', textAlign: 'center' }}>{T.cardM} 🍽️</div>
              {T.menu.map(([n, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 2px 8px #0001',
                  direction: lang === 'ar' ? 'rtl' : 'ltr', opacity: interpolate(t, [pr + i * 0.25, pr + i * 0.25 + 0.3], [0, 1], clampX), transform: `translateY(${interpolate(t, [pr + i * 0.25, pr + i * 0.25 + 0.3], [20, 0], clampX)}px)` }}>
                  <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 22, color: '#2b1d14' }}>{n}</span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 22, color: '#d35400', direction: 'ltr' }}>{v}</span>
                </div>))}
            </div>
          </Phone>
        </In>
      </>);
    }
    case 'price': {
      const items = [[c.onceAt, '✅', T.once], [c.subAt, '🚫', T.nosub], [c.shipAt, '🎁', T.ship]] as [number, string, string][];
      const n = Math.round(interpolate(t, [S0 + 0.2, S0 + 1.0], [0, 15], clampX));
      return (<>
        <In at={S0 + 0.05} x={cx} y={Y + 60}><Txt size={64} lang={lang} color="#ffd23f">{T.price}</Txt></In>
        <In at={S0 + 0.15} x={cx} y={Y + 230}>
          <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: 250, color: '#fff', direction: 'ltr', lineHeight: 1, textShadow: '0 0 60px #34A853aa, 0 12px 0 #1b5e20' }}>{n}€</div>
        </In>
        {items.map(([at, e, s], i) => (
          <In key={i} at={at ?? S0 + 1 + i} x={cx} y={Y + 470 + i * 110} from={lang === 'ar' ? 'right' : 'left'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: '#ffffff14', border: '2px solid #ffffff2a', borderRadius: 24, padding: '12px 34px', direction: lang === 'ar' ? 'rtl' : 'ltr', minWidth: 520 }}>
              <Emoji e={e} size={56} /><Txt size={46} lang={lang}>{s}</Txt>
            </div>
          </In>))}
        <In at={(c.shipAt ?? p.end - 1) + 0.9} x={cx} y={Y + 810}><Txt size={30} lang={lang} color="#ffffffaa">{T.custom}</Txt></In>
      </>);
    }
    case 'cta': {
      const wa = c.waAt ?? S0 + 2, sl = c.sloganAt ?? p.end - 1.5;
      const pulse = 1 + 0.04 * Math.sin(t * 6);
      return (<>
        <In at={S0 + 0.05} x={cx} y={Y + 70}><Logo size={90} /></In>
        <In at={S0 + 0.3} x={cx} y={Y + 210}>
          <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: 104, color: '#fff', direction: 'ltr', background: 'linear-gradient(90deg,#4285F4,#34A853)', padding: '6px 40px', borderRadius: 30, transform: `scale(${pulse})` }}>qrve.click</div>
        </In>
        <In at={S0 + 0.6} x={cx - 210} y={Y + 470}><Qr qr={tl.qr} px={250} /></In>
        <In at={wa} x={cx + 170} y={Y + 470}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: '#25D366', borderRadius: 30, padding: '22px 28px', boxShadow: '0 20px 50px #25D36666' }}>
            <Emoji e="💬" size={80} />
            <Txt size={32} lang={lang} style={{ textShadow: 'none' }}>WhatsApp</Txt>
            <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: 32, color: '#fff', direction: 'ltr' }}>+34 613 590 101</div>
          </div>
        </In>
        <In at={wa + 0.3} x={cx} y={Y + 680}><div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#fff', background: '#ffffff18', padding: '6px 26px', borderRadius: 30, direction: lang === 'ar' ? 'rtl' : 'ltr' }}>{T.ceuta}</div></In>
        <In at={sl} x={cx} y={Y + 800}><Txt size={56} lang={lang} color="#ffd23f">{T.slogan}</Txt></In>
      </>);
    }
  }
  return null;
};

const Captions: React.FC<{ tl: QrveTimeline }> = ({ tl }) => {
  const { t } = useTime();
  let cur: { ph: Phrase; color: string } | null = null;
  for (const p of tl.parts) for (const ph of p.phrases) if (t >= ph.start - 0.08 && t <= ph.end + 0.25) cur = { ph, color: p.color };
  if (!cur) return null;
  const { ph, color } = cur;
  const k = interpolate(t, [ph.start - 0.08, ph.start + 0.1], [0, 1], clampX), o = interpolate(t, [ph.end + 0.1, ph.end + 0.25], [1, 0], clampX);
  return (
    <div style={{ position: 'absolute', left: CAP.left, width: CAP.w, top: CAP.top, height: CAP.h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', direction: tl.lang === 'ar' ? 'rtl' : 'ltr', columnGap: 10, rowGap: 8, opacity: k * o, transform: `translateY(${(1 - k) * 30}px)` }}>
        {ph.words.map((w, i) => {
          const active = t >= w.start - 0.02 && t < w.end + 0.05;
          return <span key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 54, lineHeight: 1.3, padding: '0 10px', borderRadius: 12, whiteSpace: 'nowrap',
            color: active || t >= w.end ? '#fff' : '#ffffff88', background: active ? color : 'transparent', textShadow: active ? 'none' : '0 4px 18px #000, 0 2px 0 #000' }}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

export const QrveAd: React.FC<QrveProps> = ({ tl, withAudio }) => {
  const { t, lin } = useTime();
  const cur = tl.parts.find((p) => t >= p.sceneStart && t < p.sceneEnd) ?? tl.parts[tl.parts.length - 1];
  return (
    <AbsoluteFill style={{ background: '#070b18', fontFamily: FONT, overflow: 'hidden' }}>
      {/* خلفية: شبكة + توهج بلون المشهد */}
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(#ffffff08 2px, transparent 2px), linear-gradient(90deg, #ffffff08 2px, transparent 2px)', backgroundSize: '60px 60px', backgroundPosition: `0 ${t * 20}px` }} />
      {tl.parts.map((p) => {
        const o = Math.min(lin(p.sceneStart - 0.2, p.sceneStart + 0.3), 1 - lin(p.sceneEnd - 0.2, p.sceneEnd + 0.3));
        return o > 0 ? <AbsoluteFill key={p.key} style={{ opacity: o * 0.55, background: `radial-gradient(circle at 50% 38%, ${p.color}, transparent 60%)` }} /> : null;
      })}
      {withAudio && tl.parts.map((p) => <Sequence key={p.key} from={Math.round(p.start * FPS)}><Audio src={staticFile(p.audio)} /></Sequence>)}
      {tl.parts.map((p, i) => {
        if (t < p.sceneStart - 0.05 || t > p.sceneEnd + 0.4) return null;
        const outO = i + 1 < tl.parts.length ? 1 - lin(p.sceneEnd - 0.05, p.sceneEnd + 0.3) : 1;
        return <AbsoluteFill key={p.key} style={{ opacity: outO, transform: `scale(${1 + (1 - outO) * 0.08})` }}><Scene p={p} tl={tl} /></AbsoluteFill>;
      })}
      {/* شريط فوقاني صغير */}
      {cur.key !== 'cta' && <div style={{ position: 'absolute', top: 262, left: 90, width: 820, display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'ltr' }}>
        <Logo size={46} />
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#fff', background: '#ffffff1c', padding: '4px 16px', borderRadius: 20, direction: tl.lang === 'ar' ? 'rtl' : 'ltr' }}>{L[tl.lang].ceuta}</div>
      </div>}
      <Captions tl={tl} />
    </AbsoluteFill>
  );
};
