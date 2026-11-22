import '@fontsource/cairo/600.css';
import '@fontsource/cairo/800.css';
import '@fontsource/cairo/900.css';
import { continueRender, delayRender } from 'remotion';

export const FONT = "'Cairo', 'Noto Color Emoji', sans-serif";

export const COLORS = {
  bgTop: '#1a1033',
  bgBottom: '#0b0b1a',
  accent: '#ffd23f', // أصفر
  accent2: '#ff4f8b', // وردي
  accent3: '#3ee6ff', // سماوي
  text: '#ffffff',
  card: '#16161f', // خلفية الشبكة محايدة باش ما تأثرش على إدراك الألوان
};

// نتسناو الخطوط قبل التصيير
const handle = delayRender('Loading Cairo font');
Promise.all(
  ['600', '800', '900'].map((w) => document.fonts.load(`${w} 40px Cairo`, 'شكون 123')),
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
