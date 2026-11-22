export type Variant = 'A' | 'B' | 'C';

export type Challenge = {
  id: string;
  series: string;
  /** color = مربع لونو مختلف، symbol = رمز/إيموجي/حرف مختلف */
  type?: 'color' | 'symbol';
  /** النسخة (طريقة الجذب) اللي كتصيّر بها هاد الحلقة افتراضياً */
  variant?: Variant;
  seed: number;
  difficulty: string;
  grid: { rows: number; cols: number };
  baseColor: string;
  oddColor: string;
  deltaE: number;
  symbols?: { base: string; odd: string; font?: 'emoji' | 'arabic' };
  answer: number; // رقم المربع الصحيح (1 → rows*cols)
  texts: {
    title: string;
    hookA: string[];
    hookB: string;
    hookEmoji?: string;
    hookCRight: string;
    hookCLeft: string;
    hookCQuestion: string;
    instruction: string;
    countdownLabel: string;
    midHint?: string;
    commentPrompt: string;
    commentSub: string;
    revealLabel: string;
    revealSub: string;
    shareLine1: string;
    shareLine2: string;
  };
};

export type VideoProps = {
  challenge: Challenge;
  variant: Variant;
  showSafeZones: boolean;
};
